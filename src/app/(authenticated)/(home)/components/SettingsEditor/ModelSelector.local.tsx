"use client";

import { ControlLabel } from "@components/ControlLabel";
import { Dropdown } from "@components/Dropdown";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Switcher } from "@components/Switcher";
import {
  TwoLevelsDropdown,
  TwoLevelsDropdownCategory
} from "@components/TwoLevelsDropdown";
import { useRelaxedBadgeLabel } from "@domains/payment/useRelaxedBadgeLabel";
import { isMaskModel } from "@domains/renders/utils/isMaskModel";
import { isUpscaleModel } from "@domains/renders/utils/isUpscaleModel";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useTool } from "@hooks/tool/useTool";
import { useIsTeamMember } from "@hooks/userLocalStorage";
import { RENDER_MODELS } from "@models/video/constants";
import {
  isTimeBasedDurationLimits,
  MODEL_CATEGORY_ORDER,
  ModelCategory,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { modelNameWithoutRenderTarget } from "@models/video/utils/modelNameWithoutRenderTarget";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";
import { pickModelFallback } from "@/platform/modelFallback";
import {
  PROVIDER_LABEL,
  providersForVideoModel
} from "@/platform/modelProviders";
import {
  cloudUnavailableReason,
  isVideoModelAvailable,
  resolveRenderProvider
} from "@/platform/renderTarget";
import { useProviderPreferences } from "@/platform/useProviderPreferences";

import { SingleModelInfoBlock } from "./SingleModelInfoBlock";

const getMinFramesForModel = (
  model: VideoModelDefinition,
  fps: number
): number => {
  const limits = model.renderDurationLimits.modelLimits;
  if (isTimeBasedDurationLimits(limits)) {
    return Math.ceil(limits.minSeconds * fps);
  }
  return limits.minFrames;
};

const LOCAL_MODEL_TASK_SETTING_KEY = "vfx_mode";

interface CategoryGroup {
  key: ModelCategory;
  models: VideoModelDefinition[];
}

const groupModelsByCategory = (
  models: VideoModelDefinition[]
): CategoryGroup[] => {
  const grouped = new Map<ModelCategory, VideoModelDefinition[]>();

  for (const model of models) {
    if (!model.category) continue;
    const existing = grouped.get(model.category) ?? [];
    existing.push(model);
    grouped.set(model.category, existing);
  }

  return MODEL_CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
    key: cat,
    models: grouped.get(cat)!
  }));
};

export const ModelSelector: React.FC = () => {
  const { t } = useTranslation();
  const [promptMemory, setPromptMemory] = useState<Record<string, string>>({});
  const isTeamMember = useIsTeamMember();
  const { tool: projectMode } = useTool();
  const { showToast } = useToast();
  const shotMaxFrames = useShotMaxFrames();
  const { fps } = useFpsForShot();
  const relaxedBadgeLabel = useRelaxedBadgeLabel();

  const { renderSettingsValuesAtom, selectedModelAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const [values] = useAtom(renderSettingsValuesAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);

  const selectedModelName = selectedModel.name;
  const isUpscaleMode = projectMode === "upscale";
  const isMaskMode = projectMode === "mask";
  const providerPreferences = useProviderPreferences();
  const selectableModelDefinitions = RENDER_MODELS.filter((model) => {
    if (
      !isUpscaleMode &&
      !isMaskMode &&
      isComfyLocalVideoModel(model.name) &&
      model.name !== VideoEngine.minimax_h3_local
    )
      return false;
    // Switched off in settings: hidden entirely, which is the point of the
    // switches. Unavailable for any other reason stays visible but disabled,
    // because "sign in to use this" is worth saying.
    const providers = providersForVideoModel(model.name);
    if (!providers.some((provider) => providerPreferences[provider])) {
      return false;
    }
    if (isMaskMode) {
      return isMaskModel(model.name);
    }
    if (isUpscaleMode !== isUpscaleModel(model.name)) return false;
    if (model.status === "deprecated") return false;
    if (model.status === "hidden") return false;
    if (model.status === "team_only" && !isTeamMember) return false;
    return true;
  });

  const isLocalSelected = isComfyLocalVideoModel(selectedModelName);
  const categoryGroups = groupModelsByCategory(
    selectableModelDefinitions.filter(
      (model) =>
        isMaskMode || isComfyLocalVideoModel(model.name) === isLocalSelected
    )
  );
  const availableModelDefinitions = selectableModelDefinitions.filter((model) =>
    isVideoModelAvailable(model.name, undefined, providerPreferences)
  );
  const fallbackModel = pickModelFallback(
    availableModelDefinitions,
    selectedModelName,
    (model) => model.name
  );

  // Provider preferences are external state. If a switch removes the active
  // model, persist a valid replacement immediately instead of leaving a hidden
  // or disabled model selected.
  useEffect(() => {
    if (fallbackModel) setSelectedModel(fallbackModel);
  }, [fallbackModel, setSelectedModel]);

  const handlePromptOnModelSwitch = (
    newModelName: VideoEngine,
    defaultPrompt: string | undefined
  ) => {
    const isPromptWipeModel = (name: VideoEngine) =>
      name === VideoEngine.seedance_2 ||
      name === VideoEngine.happy_horse_1 ||
      name === VideoEngine.wan_animate_2_2 ||
      name === VideoEngine.wan_vace_2_1 ||
      name === VideoEngine.mago_style_transfer_local ||
      name === VideoEngine.mago_animate;

    if (isPromptWipeModel(newModelName)) {
      updateValue({ key: "prompt", value: defaultPrompt ?? "" });
      return;
    }
    if (isPromptWipeModel(selectedModelName)) {
      updateValue({ key: "prompt", value: undefined });
    }

    const isKlingSwitch =
      selectedModelName === VideoEngine.kling_o1 ||
      newModelName === VideoEngine.kling_o1;
    if (isKlingSwitch) {
      updateValue({ key: "prompt", value: "" });
    }

    if (
      newModelName === VideoEngine.v1_0_0_mask &&
      selectedModelName === VideoEngine.v1_0_0_upscaler
    ) {
      setPromptMemory({
        ...promptMemory,
        [selectedModelName]: values.prompt as string
      });
    }
    if (newModelName === VideoEngine.v1_0_0_mask) {
      updateValue({ key: "prompt", value: defaultPrompt ?? "" });
      return;
    }

    if (selectedModelName === VideoEngine.v1_0_0_mask) {
      updateValue({ key: "prompt", value: "" });
    }

    if (
      newModelName === VideoEngine.v1_0_0_upscaler &&
      selectedModelName !== VideoEngine.v1_0_0_mask
    ) {
      setPromptMemory({ ...promptMemory, other: values.prompt as string });
    }
    if (newModelName === VideoEngine.v1_0_0_upscaler) {
      const restoredPrompt = promptMemory?.[newModelName] || defaultPrompt;
      if (restoredPrompt) {
        updateValue({ key: "prompt", value: restoredPrompt });
      }
      return;
    }

    if (selectedModelName !== VideoEngine.v1_0_0_upscaler) return;
    setPromptMemory({
      ...promptMemory,
      [selectedModelName]: values.prompt as string
    });
    if (promptMemory.other) {
      updateValue({ key: "prompt", value: promptMemory.other });
    }
  };

  const updateEngine = (engine: VideoEngine) => {
    const newModel = RENDER_MODELS.find((model) => model.name === engine);
    if (!newModel) return;

    const defaultPrompt = newModel.settingsGroups[0].sections[0].settings.find(
      (setting) => setting.key === "prompt"
    )?.defaultValue;

    handlePromptOnModelSwitch(newModel.name, defaultPrompt);
    setSelectedModel(newModel);

    if (shotMaxFrames <= 0) return;
    const minFrames = getMinFramesForModel(newModel, fps);
    if (shotMaxFrames < minFrames) {
      showToast({
        message: t("notifications.video_too_short_for_model.description", {
          minFrames
        }),
        duration: 5
      });
    }
  };

  const switchRenderTarget = (isLocalTarget: boolean) => {
    const candidates = selectableModelDefinitions.filter(
      (model) => isComfyLocalVideoModel(model.name) === isLocalTarget
    );
    const target =
      candidates.find((model) =>
        isVideoModelAvailable(model.name, undefined, providerPreferences)
      ) ?? candidates[0];
    if (target && isLocalTarget !== isLocalSelected) updateEngine(target.name);
  };

  if (isUpscaleMode) {
    const selectableModels = availableModelDefinitions.map((model) => ({
      key: model.name,
      label: model.displayName,
      description: model.description,
      status: model.status
    }));

    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="shrink-0 whitespace-nowrap flex items-center gap-1.5">
            <ControlLabel
              labelColor="glyph-tertiary"
              label={t("renderSettings.mago_engine.label")}
            />
            <InfoTooltipIcon
              tooltip={t("renderSettings.upscale_engine.description")}
              labelColor="glyph-tertiary"
            />
          </div>
          <Dropdown
            className="flex-1"
            aria-label={t("renderSettings.mago_engine.label")}
            onChange={(item) => {
              item && updateEngine(item as VideoEngine);
            }}
            value={selectedModelName}
            items={selectableModels}
          />
        </div>
      </div>
    );
  }

  const dropdownCategories: TwoLevelsDropdownCategory[] = categoryGroups.map(
    (category) => ({
      key: category.key,
      label: t(`renderSettings.model_categories.${category.key}.label`),
      items: category.models.map((model) => {
        const isRelaxedEligible =
          model.modeAvailability?.isRelaxedModeAvailable !== false;
        const isModelAvailable = isVideoModelAvailable(
          model.name,
          undefined,
          providerPreferences
        );
        const provider = resolveRenderProvider(
          model.name,
          undefined,
          providerPreferences
        );
        return {
          key: model.name,
          label: modelNameWithoutRenderTarget(model.displayName),
          description: model.description,
          // Says where this model will actually run, which changes with the
          // provider switches and with being signed in.
          providerBadge: provider ? PROVIDER_LABEL[provider] : undefined,
          badge: isRelaxedEligible ? relaxedBadgeLabel : undefined,
          isDisabled: !isModelAvailable,
          disabledReason: isModelAvailable
            ? undefined
            : cloudUnavailableReason() === "not-implemented"
              ? t("renderSettings.mago_engine.cloudComingSoon", {
                  defaultValue:
                    "Cloud rendering is not available in the desktop app yet"
                })
              : t("renderSettings.mago_engine.requiresSignIn", {
                  defaultValue: "Sign in to Mago to render with this model"
                })
        };
      })
    })
  );

  const isSelectedModelTheOnlyChoice =
    dropdownCategories.flatMap((category) => category.items).length === 1;
  const localModelTaskSetting = isLocalSelected
    ? selectedModel.settingsGroups
        .flatMap((group) => group.sections)
        .flatMap((section) => section.settings)
        .find((setting) => setting.key === LOCAL_MODEL_TASK_SETTING_KEY)
    : undefined;
  const selectLocalModelTask = (task: unknown) => {
    updateValue({ key: LOCAL_MODEL_TASK_SETTING_KEY, value: task });
    const updatesForNewTask = selectedModel.onValueChange?.(
      LOCAL_MODEL_TASK_SETTING_KEY,
      task,
      values
    );
    Object.entries(updatesForNewTask ?? {}).forEach(
      ([updateKey, updateValueForKey]) => {
        updateValue({
          key: updateKey as keyof VideoSettings,
          value: updateValueForKey
        });
      }
    );
  };
  const localModelTaskOptions =
    localModelTaskSetting?.type === "enum" ? localModelTaskSetting.options : [];

  return (
    <div className="flex w-full min-w-0 flex-row items-center gap-1.5">
      {!isMaskMode && (
        <Switcher
          className="min-w-0"
          options={[
            { label: "Local", value: true },
            { label: "Cloud", value: false }
          ]}
          isOptionSelected={(option) => option.value === isLocalSelected}
          onOptionClick={(option) => switchRenderTarget(option.value)}
        />
      )}
      {isSelectedModelTheOnlyChoice ? (
        <SingleModelInfoBlock
          modelLabel={modelNameWithoutRenderTarget(selectedModel.displayName)}
        />
      ) : isLocalSelected ? (
        <Dropdown
          className="w-full min-w-0"
          aria-label={t("renderSettings.mago_engine.label")}
          value={selectedModelName}
          onChange={(key) => key && updateEngine(key as VideoEngine)}
          items={dropdownCategories.flatMap((category) => category.items)}
        />
      ) : (
        <TwoLevelsDropdown
          className="w-full min-w-0"
          label={t("renderSettings.mago_engine.label")}
          selectedKey={selectedModelName}
          selectedLabel={modelNameWithoutRenderTarget(
            selectedModel.displayName
          )}
          categories={dropdownCategories}
          onSelectionChange={(key) => updateEngine(key as VideoEngine)}
          ariaLabel={t("renderSettings.mago_engine.label")}
          testId="model-selector-trigger"
        />
      )}
      {localModelTaskOptions.length > 0 && (
        <Dropdown
          className="w-full min-w-0"
          aria-label={localModelTaskSetting?.label}
          popoverWidth="content"
          value={values[LOCAL_MODEL_TASK_SETTING_KEY] as string | undefined}
          onChange={(key) => key && selectLocalModelTask(key)}
          items={localModelTaskOptions.map((option) => ({
            key: option.value,
            label: option.label
          }))}
        />
      )}
    </div>
  );
};
