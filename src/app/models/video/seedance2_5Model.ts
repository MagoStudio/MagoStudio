import { getDurationFromFrameRange } from "@domains/renders/utils/getDurationFromFrameRange";
import {
  CalcEstimatedRenderTimeFunction,
  ModelCategory,
  VideoEngine,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { IMAGE_UPLOAD_LIMITS } from "@utils/image/imageUploadLimits";

import { appendImageTagsToPrompt } from "./appendImageTagsToPrompt";
import { findUnreferencedImageTagError } from "./findUnreferencedImageTagError";
import { passThroughOwnedSources } from "./passThroughOwnedSources";
import { referenceFrameAssetIdsFromSources } from "./referenceFrameAssetIdsFromSources";

const formatSourcesForBackend = passThroughOwnedSources;

const SEEDANCE_2_5_CREDITS_PER_SECOND_BY_RESOLUTION: Record<string, number> = {
  "480p": 252,
  "720p": 566,
  "1080p": 1274
};
const SEEDANCE_2_5_DEFAULT_RESOLUTION = "720p";
const SEEDANCE_2_5_DEFAULT_ASPECT_RATIO = "auto";
const SEEDANCE_2_5_MAX_IMAGES = 9;
const SEEDANCE_2_5_MIN_FPS = 24;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : SEEDANCE_2_5_MIN_FPS;

  const resolution =
    typeof renderSettings.resolution === "string"
      ? renderSettings.resolution
      : SEEDANCE_2_5_DEFAULT_RESOLUTION;
  const creditsPerSecond =
    SEEDANCE_2_5_CREDITS_PER_SECOND_BY_RESOLUTION[resolution] ??
    SEEDANCE_2_5_CREDITS_PER_SECOND_BY_RESOLUTION[
      SEEDANCE_2_5_DEFAULT_RESOLUTION
    ];

  const durationInSeconds = frameRangeLength / fps;
  const roundedDurationInSeconds = Math.round(durationInSeconds);
  const credits = Math.ceil(roundedDurationInSeconds * creditsPerSecond);

  return { impactToShow: credits };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const { image_ids: _image_ids, ...restSettings } = settings;

  const referenceFrameAssetIds = referenceFrameAssetIdsFromSources(
    context.sources
  ).slice(0, SEEDANCE_2_5_MAX_IMAGES);
  const imageIds =
    referenceFrameAssetIds.length > 0 ? referenceFrameAssetIds : undefined;

  return {
    ...restSettings,
    fps: context.fps,
    durationInSeconds: getDurationFromFrameRange(
      context.frameRange,
      context.fps
    ),
    frameRangeSeconds: [
      context.frameRange[0] / context.fps,
      context.frameRange[1] / context.fps
    ],
    resolution:
      (settings.resolution as string) ?? SEEDANCE_2_5_DEFAULT_RESOLUTION,
    aspect_ratio:
      (settings.aspect_ratio as string) ?? SEEDANCE_2_5_DEFAULT_ASPECT_RATIO,
    generate_audio: (settings.generate_audio as boolean) ?? false,
    image_ids: imageIds
  };
};

const onValueChange = (
  key: string,
  value: unknown,
  currentValues: VideoSettings
): Partial<VideoSettings> | undefined => {
  if (key === "image_ids" && Array.isArray(value)) {
    const prompt = (currentValues.prompt as string) || "";
    const newPrompt = appendImageTagsToPrompt(value as string[], prompt);
    if (newPrompt) {
      return { prompt: newPrompt };
    }
  }

  return undefined;
};

export const seedance2_5Model: VideoModelDefinition = {
  name: VideoEngine.seedance_2_5,
  capabilities: {
    overwritesPromptOnSelect: true
  },
  displayName: "Seedance 2.5 - vid2vid",
  description:
    "Transform your video using reference images with up to 9 image inputs",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
  modeAvailability: {
    isRelaxedModeAvailable: false
  },
  disableDownload: ["frames", "video+frames"],
  calcEstimatedRenderTime,
  renderDurationLimits: {
    defaultFrameRange: {
      defaultRenderSeconds: 5,
      testRenderSeconds: 4
    },
    modelLimits: { minSeconds: 4, maxSeconds: 30 }
  } satisfies RenderDurationLimits,
  settingsGroups: [
    {
      name: "Basic",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip: "Give instructions using @video1 and @Image references",
              ui: "Prompt",
              defaultValue:
                "Use @video1 as a reference for camera movement and composition and turn it into",
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: {
                hideAutoPrompt: true,
                doubleHeight: true
              },
              customValidation: (value, _allValues, sources = []) => {
                if (!value || typeof value !== "string") return null;

                const imageIds = referenceFrameAssetIdsFromSources(sources);
                const promptLower = value.toLowerCase();

                for (let i = 0; i < SEEDANCE_2_5_MAX_IMAGES; i++) {
                  if (promptLower.includes(`@image${i + 1}`) && !imageIds[i]) {
                    return `Please add @Image${i + 1} or remove it from your prompt`;
                  }
                }

                return findUnreferencedImageTagError(
                  value,
                  imageIds,
                  SEEDANCE_2_5_MAX_IMAGES
                );
              }
            },
            {
              key: "image_ids",
              type: "array",
              label: "Reference (up to 9 images)",
              tooltip: "Scenery, style or atmosphere references",
              ui: "MultiImageUploader",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big",
                maxImageSlots: SEEDANCE_2_5_MAX_IMAGES
              },
              defaultValue: [],
              nullable: true
            }
          ]
        }
      ]
    },
    {
      name: "Advanced",
      level: "advanced",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "generate_audio",
              type: "boolean",
              label: "Generate audio",
              tooltip: "Generate audio matching your scene",
              ui: "SwitchInput",
              defaultValue: false,
              nullable: false
            },
            {
              key: "resolution",
              type: "enum",
              label: "Resolution",
              tooltip: "Output video resolution",
              ui: "SelectInput",
              options: [
                { value: "480p", label: "480p" },
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" }
              ],
              defaultValue: SEEDANCE_2_5_DEFAULT_RESOLUTION,
              nullable: false
            },
            {
              key: "aspect_ratio",
              type: "enum",
              label: "Aspect ratio",
              tooltip: "Output video aspect ratio",
              ui: "SelectInput",
              options: [
                { value: "auto", label: "Auto" },
                { value: "21:9", label: "21:9" },
                { value: "16:9", label: "16:9" },
                { value: "4:3", label: "4:3" },
                { value: "1:1", label: "1:1" },
                { value: "3:4", label: "3:4" },
                { value: "9:16", label: "9:16" }
              ],
              defaultValue: SEEDANCE_2_5_DEFAULT_ASPECT_RATIO,
              nullable: false
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend,
  formatSourcesForBackend,
  onValueChange
};
