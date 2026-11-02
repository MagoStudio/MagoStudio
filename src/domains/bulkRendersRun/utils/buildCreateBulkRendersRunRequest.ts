import { getAdapter } from "@home/components/Navbar/Img2ImgModalV2/adapters";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { RenderMode } from "@hooks/types";
import {
  VIDEO_ONLY_ENGINES,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import {
  BULK_RENDERS_RUN_NAME_MAX_LENGTH,
  BulkRendersRunSettings,
  CreateBulkRendersRunRequest
} from "@schemas/bulkRendersRun";

import { formatBulkRendersRunVideoSettingsForBackend } from "./formatBulkRendersRunVideoSettingsForBackend";
import { truncateByCodePoint } from "./truncateByCodePoint";

export const FRONTEND_ONLY_SETTING_KEYS = [
  "source_image_slot",
  "convert_pngs_to_exrs",
  "exr_use_float16",
  "image_sequence_export",
  "additional_reference_image",
  "background_images",
  "character_images",
  "objects_images",
  "keyframe_index",
  "image_ids",
  "reference_image_id",
  "frontal_image_id",
  "mago_engine",
  "reference_image_paths",
  "image_paths",
  "ipadapter_image_source",
  "crop_coordinates",
  "source_video_dimensions",
  "input_mask",
  "use_video_reference"
] as const;

export interface BulkRendersRunShotPromptOverride {
  imagePrompt?: string;
  videoPrompt?: string;
}

export interface BulkRendersRunShotSettingsOverride extends BulkRendersRunShotPromptOverride {
  imageReferenceAssetIds?: string[];
  imageSettings?: Img2ImgType;
  imageSourceFrame?: number;
  videoSettingsPatch?: Partial<VideoSettings>;
  uploadedFirstFrameAssetId?: string;
}

export interface BuildCreateBulkRendersRunRequestInput {
  projectId: string;
  selectedShotIds: string[];
  name: string;
  renderSettingsValues: VideoSettings;
  videoModel: VideoModelDefinition;
  renderEngine: VideoEngine;
  renderMode: RenderMode;
  frameRange: [number, number];
  imageSettings: Img2ImgType;
  imagePrompt: string;
  imageRenderModel: string;
  imageReferenceAssetIds: string[];
  shotSettingsOverrideById?: Record<string, BulkRendersRunShotSettingsOverride>;
  isTeamMember: boolean;
  firstFrameSource: "generated" | "uploaded";
  isFullFrameRangePresetSelected: boolean;
  shotMaxFramesById: Map<string, number>;
}

/** `mago_engine` is a frontend-only key, so it is stripped from the wire payload — but it is
 * where a Mago model records the engine its own settings resolve to. Read before the strip, the
 * same way `mapPlanSettings` does for a single render, so a Bulk Renders Run and a single render
 * of the same Shot cannot disagree about the engine. */
const resolveRenderEngine = ({
  renderSettingsValues,
  renderEngine
}: Pick<
  BuildCreateBulkRendersRunRequestInput,
  "renderSettingsValues" | "renderEngine"
>): VideoEngine => {
  const engineFromSettings = renderSettingsValues.mago_engine;
  return typeof engineFromSettings === "string"
    ? (engineFromSettings as VideoEngine)
    : renderEngine;
};

const withoutFrontendOnlyKeys = (
  settings: Partial<VideoSettings>
): Record<string, unknown> => {
  const wireSettings: Record<string, unknown> = { ...settings };
  for (const key of FRONTEND_ONLY_SETTING_KEYS) {
    delete wireSettings[key];
  }
  return wireSettings;
};

const buildVideoSettings = ({
  renderSettingsValues,
  videoModel,
  resolvedRenderEngine,
  renderMode,
  frameRange
}: Pick<
  BuildCreateBulkRendersRunRequestInput,
  "renderSettingsValues" | "videoModel" | "renderMode" | "frameRange"
> & { resolvedRenderEngine: VideoEngine }): BulkRendersRunSettings => ({
  ...withoutFrontendOnlyKeys(
    formatBulkRendersRunVideoSettingsForBackend({
      videoSettings: renderSettingsValues,
      videoModel,
      frameRange
    })
  ),
  engine: resolvedRenderEngine,
  render_mode: renderMode,
  frame_range: frameRange
});

const IMG2IMG_FILE_TYPE = "jpg";

const SUPPLIED_FIRST_FRAME_TYPE = "reference_frame" as const;

const IMG2IMG_KEYS_NOT_SHAREABLE_ACROSS_SHOTS = ["mask_image_id"] as const;

const withoutKeysNotShareableAcrossShots = (
  settings: Record<string, unknown>
): Record<string, unknown> => {
  const shareableSettings = { ...settings };
  for (const key of IMG2IMG_KEYS_NOT_SHAREABLE_ACROSS_SHOTS) {
    delete shareableSettings[key];
  }
  return shareableSettings;
};

const buildImg2ImgSettings = ({
  imageSettings,
  imagePrompt,
  imageRenderModel,
  imageReferenceAssetIds,
  renderMode
}: Pick<
  BuildCreateBulkRendersRunRequestInput,
  | "imageSettings"
  | "imagePrompt"
  | "imageRenderModel"
  | "imageReferenceAssetIds"
  | "renderMode"
>): BulkRendersRunSettings => ({
  ...withoutKeysNotShareableAcrossShots(
    getAdapter(imageSettings).buildSettings(imageSettings)
  ),
  prompt: imagePrompt,
  render_model: imageRenderModel,
  render_mode: renderMode,
  reference_images: imageReferenceAssetIds,
  img_file_type: IMG2IMG_FILE_TYPE
});

const buildShotModelImg2ImgSettings = (
  shotImageSettings: Img2ImgType
): Record<string, unknown> => ({
  ...withoutKeysNotShareableAcrossShots(
    getAdapter(shotImageSettings).buildSettings(shotImageSettings)
  ),
  render_model: shotImageSettings.model
});

const buildShotOverrides = ({
  shotSettingsOverrideById,
  selectedShotIds,
  isFullFrameRangePresetSelected,
  shotMaxFramesById
}: {
  shotSettingsOverrideById: Record<string, BulkRendersRunShotSettingsOverride>;
  selectedShotIds: string[];
  isFullFrameRangePresetSelected: boolean;
  shotMaxFramesById: Map<string, number>;
}): CreateBulkRendersRunRequest["shot_overrides"] => {
  const entries = selectedShotIds.flatMap((shotId) => {
    const override = shotSettingsOverrideById[shotId] ?? {};
    const shotFrameCount = shotMaxFramesById.get(shotId) ?? 0;
    const fullFrameRangeForShot: [number, number] | undefined =
      isFullFrameRangePresetSelected && shotFrameCount > 0
        ? [0, shotFrameCount]
        : undefined;

    const hasImagePromptOverride = override.imagePrompt !== undefined;
    const hasVideoPromptOverride = override.videoPrompt !== undefined;
    const hasImageReferenceOverride =
      override.imageReferenceAssetIds !== undefined;
    const hasImageModelOverride = override.imageSettings !== undefined;
    const hasImageSourceFrameOverride = override.imageSourceFrame !== undefined;
    const hasVideoSettingsPatchOverride =
      Object.keys(override.videoSettingsPatch ?? {}).length > 0;
    const hasUploadedFirstFrame =
      override.uploadedFirstFrameAssetId !== undefined;
    const hasImg2ImgOverride =
      !hasUploadedFirstFrame &&
      (hasImagePromptOverride ||
        hasImageReferenceOverride ||
        hasImageModelOverride ||
        hasImageSourceFrameOverride);
    const hasFullFrameRangeOverride = fullFrameRangeForShot !== undefined;
    const hasVideoSettingsOverride =
      hasVideoPromptOverride ||
      hasVideoSettingsPatchOverride ||
      hasFullFrameRangeOverride;
    if (
      !hasUploadedFirstFrame &&
      !hasImg2ImgOverride &&
      !hasVideoSettingsOverride
    ) {
      return [];
    }

    return [
      [
        shotId,
        {
          ...(hasUploadedFirstFrame
            ? {
                images: [
                  {
                    asset_id: override.uploadedFirstFrameAssetId as string,
                    type: SUPPLIED_FIRST_FRAME_TYPE
                  }
                ]
              }
            : {}),
          ...(hasImg2ImgOverride
            ? {
                img2img_settings: {
                  ...(override.imageSettings
                    ? buildShotModelImg2ImgSettings(override.imageSettings)
                    : {}),
                  ...(hasImagePromptOverride
                    ? { prompt: override.imagePrompt }
                    : {}),
                  ...(hasImageReferenceOverride
                    ? { reference_images: override.imageReferenceAssetIds }
                    : {}),
                  ...(hasImageSourceFrameOverride
                    ? { frame: override.imageSourceFrame }
                    : {})
                }
              }
            : {}),
          ...(hasVideoSettingsOverride
            ? {
                video_settings: {
                  ...(override.videoSettingsPatch
                    ? withoutFrontendOnlyKeys(override.videoSettingsPatch)
                    : {}),
                  ...(hasVideoPromptOverride
                    ? { prompt: override.videoPrompt }
                    : {}),
                  ...(hasFullFrameRangeOverride
                    ? { frame_range: fullFrameRangeForShot }
                    : {})
                }
              }
            : {})
        }
      ] as const
    ];
  });

  return entries.length > 0
    ? (Object.fromEntries(
        entries
      ) as CreateBulkRendersRunRequest["shot_overrides"])
    : undefined;
};

const assertEverySelectedShotHasAnUploadedFirstFrameWhenRequired = ({
  firstFrameSource,
  selectedShotIds,
  shotSettingsOverrideById
}: Pick<
  BuildCreateBulkRendersRunRequestInput,
  "firstFrameSource" | "selectedShotIds"
> & {
  shotSettingsOverrideById: Record<string, BulkRendersRunShotSettingsOverride>;
}): void => {
  if (firstFrameSource !== "uploaded") return;

  const shotIdsMissingAnUploadedFirstFrame = selectedShotIds.filter(
    (shotId) => !shotSettingsOverrideById[shotId]?.uploadedFirstFrameAssetId
  );

  if (shotIdsMissingAnUploadedFirstFrame.length > 0) {
    throw new Error(
      `buildCreateBulkRendersRunRequest: refusing to launch a supplied-frames run with an unfilled Shot (would fall back to generating an image): ${shotIdsMissingAnUploadedFirstFrame.join(", ")}`
    );
  }
};

export const buildCreateBulkRendersRunRequest = (
  input: BuildCreateBulkRendersRunRequestInput
): CreateBulkRendersRunRequest => {
  assertEverySelectedShotHasAnUploadedFirstFrameWhenRequired({
    firstFrameSource: input.firstFrameSource,
    selectedShotIds: input.selectedShotIds,
    shotSettingsOverrideById: input.shotSettingsOverrideById ?? {}
  });

  const resolvedRenderEngine = resolveRenderEngine(input);
  const video_settings = buildVideoSettings({
    ...input,
    resolvedRenderEngine
  });
  const doesEngineSkipImageChain = VIDEO_ONLY_ENGINES.has(resolvedRenderEngine);
  const shot_overrides = buildShotOverrides({
    shotSettingsOverrideById: input.shotSettingsOverrideById ?? {},
    selectedShotIds: input.selectedShotIds,
    isFullFrameRangePresetSelected: input.isFullFrameRangePresetSelected,
    shotMaxFramesById: input.shotMaxFramesById
  });

  return {
    project_id: input.projectId,
    timeline_ids: input.selectedShotIds,
    name: truncateByCodePoint(input.name, BULK_RENDERS_RUN_NAME_MAX_LENGTH),
    video_settings,
    ...(doesEngineSkipImageChain
      ? {}
      : { img2img_settings: buildImg2ImgSettings(input) }),
    ...(shot_overrides ? { shot_overrides } : {})
  };
};
