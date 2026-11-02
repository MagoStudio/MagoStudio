"use client";

import { useUser } from "@clerk/react";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImage } from "@domains/renders/types";
import { getEngineFamily } from "@domains/renders/utils/getEngineFamily";
import { isMaskModel } from "@domains/renders/utils/isMaskModel";
import {
  parseRenderDataForFrontend,
  parseSourcesForFrontend
} from "@domains/renders/utils/parseRenderDataForFrontend";
import { promoteKeyFrameToReferenceFrame } from "@domains/renders/utils/promoteKeyFrameToReferenceFrame";
import { promoteLegacySlotSourceToPrimaryRole } from "@domains/renders/utils/promoteLegacySlotSourceToPrimaryRole";
import { promoteReferenceFrameToKeyFrame } from "@domains/renders/utils/promoteReferenceFrameToKeyFrame";
import { promoteReferenceFrameToMotionReference } from "@domains/renders/utils/promoteReferenceFrameToMotionReference";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { type Tool, useTool } from "@hooks/tool/useTool";
import { DEFAULT_PRESET } from "@models/preset";
import {
  DEFAULT_RENDER_MODEL,
  RENDER_MODELS,
  UPSCALE_MODELS
} from "@models/video/constants";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import {
  VideoSettings,
  VideoEngine,
  VideoModelDefinition
} from "@models/video/types";
import { deriveImageSequenceExport } from "@models/video/utils/deriveImageSequenceExport";
import { getPrimarySourceSlotRole } from "@models/video/utils/getPrimarySourceSlotRole";
import { getPrimarySourceSlotRoles } from "@models/video/utils/getPrimarySourceSlotRoles";
import { modelSupportedSourceRoles } from "@models/video/utils/modelSupportedSourceRoles";
import { modelUsesKeyFrameSlot } from "@models/video/utils/modelUsesKeyFrameSlot";
import { modelUsesReferenceFrameSlot } from "@models/video/utils/modelUsesReferenceFrameSlot";
import { sourceRolesFillingPrimarySlot } from "@models/video/utils/sourceRolesFillingPrimarySlot";
import { atom } from "jotai";
import { useMemo } from "react";

import { getCropStorageAtom } from "./cropStore";
import { applyControlnetDefaults } from "./utils/applyControlnetDefaults";
import {
  buildRenderSettingsStorageKey,
  RenderSettingsStorageMode
} from "./utils/buildRenderSettingsStorageKey";
import { createScopedStorageAtomCache } from "./utils/createScopedStorageAtomCache";
import { enrichVideoSettingsFromSources } from "./utils/enrichVideoSettingsFromSources";
import { isAlwaysVisibleSetting } from "./utils/isAlwaysVisibleSetting";
import { preservedPromptFieldsOnModelSwitch } from "./utils/preservedPromptFieldsOnModelSwitch";
import { preservedValuesOnPresetApply } from "./utils/preservedValuesOnPresetApply";

const toolToStorageMode = (tool: Tool): RenderSettingsStorageMode => {
  if (tool === "upscale") return "upscale";
  if (tool === "mask") return "mask";
  if (tool === "image-to-video") return "image-to-video";
  return "render";
};

interface SelectedPresetState {
  presetId: string;
  isPristine: boolean;
}

interface RenderSettingsStorage {
  selectedModelName: VideoEngine;
  values: VideoSettings;
  sources: SourceImage[];
  selectedPreset?: SelectedPresetState;
}

const migrateLegacySources = (
  values: VideoSettings,
  existing?: SourceImage[]
): SourceImage[] => {
  if (existing && existing.length > 0) return existing;
  return parseSourcesForFrontend({ render_settings: { magov2: values } });
};

const readSourcesForModel = (
  model: VideoModelDefinition,
  values: VideoSettings,
  existing?: SourceImage[]
): SourceImage[] =>
  promoteLegacySlotSourceToPrimaryRole(
    migrateLegacySources(values, existing),
    getPrimarySourceSlotRoles(model),
    modelSupportedSourceRoles(model),
    typeof values.keyframe_index === "number" ? values.keyframe_index : 0
  );

const getDefaultStorage = (
  defaultModel: VideoModelDefinition
): RenderSettingsStorage => {
  const isPresetEligible = getEngineFamily(defaultModel.name) === "render";

  const presetModel = isPresetEligible
    ? (RENDER_MODELS.find((m) => m.name === DEFAULT_PRESET.model) ??
      defaultModel)
    : defaultModel;

  const baseDefaults = extractDefaultVideoSettings(
    presetModel
  ) as VideoSettings;

  const defaultPresetSettings = {
    ...baseDefaults,
    ...DEFAULT_PRESET.settingsOverrides
  };

  return {
    selectedModelName: presetModel.name as VideoEngine,
    values: defaultPresetSettings,
    sources: [],
    selectedPreset: {
      presetId: DEFAULT_PRESET.id,
      isPristine: true
    }
  };
};

const getDefaultModelForMode = (
  mode: RenderSettingsStorageMode
): VideoModelDefinition => {
  if (mode === "upscale") {
    const upscaleModelName = UPSCALE_MODELS[0];
    const upscaleModel = RENDER_MODELS.find(
      (model) => model.name === upscaleModelName
    );
    if (upscaleModel) return upscaleModel;
  }
  if (mode === "mask") {
    const maskModel = RENDER_MODELS.find((model) => isMaskModel(model.name));
    if (maskModel) return maskModel;
  }
  if (mode === "image-to-video") {
    const imageToVideoModel = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.seedance_2_i2v
    );
    if (imageToVideoModel) return imageToVideoModel;
  }
  return DEFAULT_RENDER_MODEL;
};

const scopedAtomCachesByMode = new Map<
  RenderSettingsStorageMode,
  ReturnType<typeof createScopedStorageAtomCache<RenderSettingsStorage>>
>();

const getScopedAtomCacheForMode = (mode: RenderSettingsStorageMode) => {
  if (!scopedAtomCachesByMode.has(mode)) {
    scopedAtomCachesByMode.set(
      mode,
      createScopedStorageAtomCache<RenderSettingsStorage>({
        defaultValue: getDefaultStorage(getDefaultModelForMode(mode)),
        options: { getOnInit: true }
      })
    );
  }

  return scopedAtomCachesByMode.get(mode)!;
};

function getStorageAtom(
  userId: string | undefined,
  projectId: string | undefined,
  shotId: string | undefined,
  mode: RenderSettingsStorageMode
) {
  const scopedKey = buildRenderSettingsStorageKey({
    userId,
    projectId,
    shotId,
    mode
  });

  return getScopedAtomCacheForMode(mode)(
    scopedKey ? `render-settings-${scopedKey}` : undefined
  );
}

export function useRenderSettingsAtoms() {
  const projectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { tool } = useTool();

  const { user } = useUser();
  const userId = user?.id;

  // eslint-disable-next-line no-restricted-syntax -- atom identity must be stable across renders
  return useMemo(() => {
    const storageMode = toolToStorageMode(tool);

    const storageAtom = getStorageAtom(
      userId,
      projectId,
      selectedShotId,
      storageMode
    );

    const selectedModelAtom = atom(
      (get) => {
        if (storageMode === "mask") {
          return getDefaultModelForMode("mask");
        }
        const storage = get(storageAtom);
        const model = RENDER_MODELS.find(
          (m) => m.name === storage.selectedModelName
        );
        return model || getDefaultModelForMode(storageMode);
      },
      (get, set, newModel: VideoModelDefinition) => {
        const storage = get(storageAtom);

        if (storage.selectedModelName === newModel.name) {
          return;
        }

        const newDefaults = extractDefaultVideoSettings(
          newModel
        ) as VideoSettings;

        const preservedValues = preservedPromptFieldsOnModelSwitch(
          newModel,
          storage.values
        );

        const updatedValues = {
          ...newDefaults,
          ...preservedValues,
          mago_engine: newModel.name as VideoEngine
        } as VideoSettings;

        const migratedSources = migrateLegacySources(
          storage.values,
          storage.sources
        );
        const shouldPromoteToReferenceFrame =
          modelUsesReferenceFrameSlot(newModel) &&
          !modelUsesKeyFrameSlot(newModel);
        const promotedSources = shouldPromoteToReferenceFrame
          ? promoteKeyFrameToReferenceFrame(migratedSources)
          : migratedSources;
        const supportedSourceRoles = modelSupportedSourceRoles(newModel);
        const nextSources = promotedSources.filter((entry) =>
          supportedSourceRoles.has(entry.type)
        );

        set(storageAtom, {
          ...storage,
          selectedModelName: newModel.name as VideoEngine,
          values: updatedValues,
          sources: nextSources,
          selectedPreset: undefined
        });
      }
    );

    const renderSettingsValuesAtom = atom(
      (get) => {
        const storage = get(storageAtom);
        const currentModel = RENDER_MODELS.find(
          (m) => m.name === storage.selectedModelName
        );
        const modelDefaults = currentModel
          ? (extractDefaultVideoSettings(currentModel) as VideoSettings)
          : {};
        const values: VideoSettings = { ...modelDefaults, ...storage.values };
        if (!currentModel) {
          return enrichVideoSettingsFromSources(
            values,
            migrateLegacySources(values, storage.sources),
            []
          );
        }
        return enrichVideoSettingsFromSources(
          values,
          readSourcesForModel(currentModel, values, storage.sources),
          sourceRolesFillingPrimarySlot(currentModel)
        );
      },
      (get, set, newValues: Partial<VideoSettings>) => {
        const storage = get(storageAtom);
        set(storageAtom, {
          ...storage,
          values: { ...storage.values, ...newValues }
        });
      }
    );

    const sourcesAtom = atom(
      (get) => {
        const storage = get(storageAtom);
        return readSourcesForModel(
          get(selectedModelAtom),
          storage.values,
          storage.sources
        );
      },
      (get, set, nextSources: SourceImage[]) => {
        const storage = get(storageAtom);
        set(storageAtom, {
          ...storage,
          sources: nextSources
        });
      }
    );

    const updateValueAtom = atom(
      null,
      (
        get,
        set,
        payload: {
          key: keyof VideoSettings;
          value: any;
          preservePreset?: boolean;
        }
      ) => {
        const storage = get(storageAtom);
        const model = get(selectedModelAtom);
        const { key, value, preservePreset = false } = payload;
        let updatedValues = { ...storage.values, [key]: value };

        if (key === "control_type") {
          updatedValues = applyControlnetDefaults(model, updatedValues, value);
        }

        if (key === "skip_cnet_preprocess" && value === true) {
          updatedValues = applyControlnetDefaults(
            model,
            { ...updatedValues, control_type: "depth" },
            "depth"
          );
        }

        let updatedPreset = storage.selectedPreset;
        if (storage.selectedPreset && !preservePreset) {
          const isNotAlwaysVisible = !isAlwaysVisibleSetting(
            String(key),
            model
          );

          if (isNotAlwaysVisible) {
            updatedPreset = undefined;
          }
        }

        set(storageAtom, {
          ...storage,
          values: updatedValues,
          selectedPreset: updatedPreset
        });
      }
    );

    const clearMaskAsInpaintingInputAtom = atom(null, (get, set) => {
      const storage = get(storageAtom);
      set(storageAtom, {
        ...storage,
        values: {
          ...storage.values,
          input_mask: "",
          mask_prompt: ""
        }
      });
    });

    const resetToDefaultsAtom = atom(null, (get, set) => {
      const storage = get(storageAtom);
      const model = get(selectedModelAtom);
      const modelDefaults = extractDefaultVideoSettings(model) as VideoSettings;

      set(storageAtom, {
        ...storage,
        values: modelDefaults,
        sources: [],
        selectedPreset: undefined
      });
    });

    const loadSettingsAtom = atom(
      null,
      (
        get,
        set,
        payload: {
          values: VideoSettings;
          sources?: SourceImage[];
          presetId?: string;
          targetTool: Tool;
        }
      ) => {
        const storage = get(storageAtom);
        const {
          values: newValues,
          sources: incomingFromCaller,
          presetId,
          targetTool
        } = payload;

        let detectedModelName = storage.selectedModelName;
        let detectedModel: VideoModelDefinition | undefined;

        if (newValues.mago_engine) {
          const foundModel = RENDER_MODELS.find(
            (m) => m.name === newValues.mago_engine
          );
          if (foundModel) {
            detectedModelName = foundModel.name as VideoEngine;
            detectedModel = foundModel;
          }
        }

        const transformedValues = detectedModel?.formatValuesForFrontend
          ? detectedModel.formatValuesForFrontend(newValues)
          : newValues;

        if (detectedModelName === VideoEngine.V4_1_0) {
          detectedModelName = VideoEngine.V4_0_0;
        }

        const targetMode = toolToStorageMode(targetTool);
        const targetStorageAtom = getStorageAtom(
          userId,
          projectId,
          selectedShotId,
          targetMode
        );

        const targetStorage = get(targetStorageAtom);
        const parsedData = parseRenderDataForFrontend({
          render_settings: { magov2: transformedValues }
        });

        const cropStorageAtom = getCropStorageAtom(
          userId,
          projectId,
          selectedShotId
        );
        set(cropStorageAtom, { crop: parsedData.crop });

        const incomingSources =
          incomingFromCaller && incomingFromCaller.length > 0
            ? incomingFromCaller
            : parsedData.sources;
        const shouldPromoteKeyFrameSlot =
          !!detectedModel &&
          modelUsesKeyFrameSlot(detectedModel) &&
          !modelUsesReferenceFrameSlot(detectedModel);
        const keyFrameSlotRole = detectedModel
          ? getPrimarySourceSlotRole(detectedModel)
          : undefined;
        const promotedSources = !shouldPromoteKeyFrameSlot
          ? incomingSources
          : keyFrameSlotRole === "motion_reference"
            ? promoteReferenceFrameToMotionReference(incomingSources)
            : promoteReferenceFrameToKeyFrame(
                incomingSources,
                typeof transformedValues.keyframe_index === "number"
                  ? transformedValues.keyframe_index
                  : 0
              );
        const selectedModel =
          detectedModel ??
          RENDER_MODELS.find((m) => m.name === detectedModelName) ??
          getDefaultModelForMode(targetMode);
        const supportedSourceRoles = modelSupportedSourceRoles(selectedModel);
        const nextSources = promotedSources.filter((entry) =>
          supportedSourceRoles.has(entry.type)
        );
        const valuesWithoutLegacy = deriveImageSequenceExport(
          parsedData.renderSettings
        );

        set(targetStorageAtom, {
          ...targetStorage,
          selectedModelName: detectedModelName,
          values: valuesWithoutLegacy,
          sources: nextSources,
          selectedPreset: presetId ? { presetId, isPristine: true } : undefined
        });
      }
    );

    const selectedPresetAtom = atom(
      (get) => get(storageAtom).selectedPreset,
      (get, set, newPreset: SelectedPresetState | undefined) => {
        const storage = get(storageAtom);
        set(storageAtom, {
          ...storage,
          selectedPreset: newPreset
        });
      }
    );

    const applyPresetAtom = atom(
      null,
      (
        get,
        set,
        payload: {
          presetId: string;
          modelName: VideoEngine;
          settingsOverrides: Partial<VideoSettings>;
        }
      ) => {
        const storage = get(storageAtom);
        const { presetId, modelName, settingsOverrides } = payload;

        const targetModel = RENDER_MODELS.find((m) => m.name === modelName);
        if (!targetModel) return;

        const newSettings = {
          ...preservedValuesOnPresetApply(
            targetModel,
            storage.values,
            settingsOverrides
          ),
          mago_engine: modelName
        } as VideoSettings;

        const migratedSources = migrateLegacySources(
          storage.values,
          storage.sources
        );
        const supportedSourceRoles = modelSupportedSourceRoles(targetModel);
        const nextSources = migratedSources.filter((entry) =>
          supportedSourceRoles.has(entry.type)
        );

        set(storageAtom, {
          ...storage,
          selectedModelName: modelName,
          values: newSettings,
          sources: nextSources,
          selectedPreset: { presetId, isPristine: true }
        });
      }
    );

    const applyMaskAsInpaintingInputAtom = atom(
      null,
      (get, set, maskTrackId: string) => {
        const renderStorageAtom = getStorageAtom(
          userId,
          projectId,
          selectedShotId,
          "render"
        );
        const renderStorage = get(renderStorageAtom);

        const inpaintingModel = RENDER_MODELS.find(
          (m) => m.name === VideoEngine.V5_1_0
        );
        if (!inpaintingModel) return;

        const isAlreadyInpainting =
          renderStorage.selectedModelName === VideoEngine.V5_1_0;

        let nextValues: VideoSettings;
        if (isAlreadyInpainting) {
          nextValues = {
            ...renderStorage.values,
            input_mask: maskTrackId,
            mask_prompt: ""
          } as VideoSettings;
        } else {
          const defaults = extractDefaultVideoSettings(
            inpaintingModel
          ) as VideoSettings;
          const preserved = preservedPromptFieldsOnModelSwitch(
            inpaintingModel,
            renderStorage.values
          );
          nextValues = {
            ...defaults,
            ...preserved,
            mago_engine: VideoEngine.V5_1_0,
            input_mask: maskTrackId
          } as VideoSettings;
        }

        const promotedSources = promoteKeyFrameToReferenceFrame(
          migrateLegacySources(renderStorage.values, renderStorage.sources)
        );
        const supportedSourceRoles = modelSupportedSourceRoles(inpaintingModel);
        const nextSources = promotedSources.filter((entry) =>
          supportedSourceRoles.has(entry.type)
        );

        set(renderStorageAtom, {
          ...renderStorage,
          selectedModelName: VideoEngine.V5_1_0,
          values: nextValues,
          sources: nextSources,
          selectedPreset: undefined
        });
      }
    );

    return {
      storageAtom,
      selectedModelAtom,
      renderSettingsValuesAtom,
      sourcesAtom,
      updateValueAtom,
      resetToDefaultsAtom,
      loadSettingsAtom,
      selectedPresetAtom,
      applyPresetAtom,
      applyMaskAsInpaintingInputAtom,
      clearMaskAsInpaintingInputAtom
    };
  }, [userId, projectId, selectedShotId, tool]);
}
