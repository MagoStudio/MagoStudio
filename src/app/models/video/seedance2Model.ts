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

const SEEDANCE_2_CREDITS_PER_SECOND_BY_RESOLUTION: Record<string, number> = {
  "720p": 370,
  "1080p": 833,
  "4k": 1875
};
const SEEDANCE_2_DEFAULT_RESOLUTION = "1080p";
const SEEDANCE_2_MAX_IMAGES = 9;
const SEEDANCE_2_MIN_FPS = 24;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : SEEDANCE_2_MIN_FPS;

  const resolution =
    typeof renderSettings.resolution === "string"
      ? renderSettings.resolution
      : SEEDANCE_2_DEFAULT_RESOLUTION;
  const creditsPerSecond =
    SEEDANCE_2_CREDITS_PER_SECOND_BY_RESOLUTION[resolution] ??
    SEEDANCE_2_CREDITS_PER_SECOND_BY_RESOLUTION[SEEDANCE_2_DEFAULT_RESOLUTION];

  const seconds = frameRangeLength / fps;
  const credits = Math.ceil(seconds * creditsPerSecond);

  return { impactToShow: credits };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const { image_ids: _image_ids, ...restSettings } = settings;

  const referenceFrameAssetIds = referenceFrameAssetIdsFromSources(
    context.sources
  );
  const imageIds =
    referenceFrameAssetIds.length > 0 ? referenceFrameAssetIds : undefined;

  return {
    ...restSettings,
    max_size: 1,
    steps: 1,
    upscale_chunk_size: 120,
    width: context.inputVideoWidth,
    height: context.inputVideoHeight,
    fps: context.fps,
    durationInSeconds: getDurationFromFrameRange(
      context.frameRange,
      context.fps
    ),
    frameRangeSeconds: [
      context.frameRange[0] / context.fps,
      context.frameRange[1] / context.fps
    ],
    offsetInSeconds: context.frameRange[0] / context.fps,
    resolution: (settings.resolution as string) ?? "1080p",
    aspect_ratio: "auto",
    duration: "auto",
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

export const seedance2Model: VideoModelDefinition = {
  name: VideoEngine.seedance_2,
  capabilities: {},
  displayName: "Seedance 2.0",
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
    modelLimits: { minSeconds: 4, maxSeconds: 15 }
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

                for (let i = 0; i < SEEDANCE_2_MAX_IMAGES; i++) {
                  if (promptLower.includes(`@image${i + 1}`) && !imageIds[i]) {
                    return `Please add @Image${i + 1} or remove it from your prompt`;
                  }
                }

                return findUnreferencedImageTagError(
                  value,
                  imageIds,
                  SEEDANCE_2_MAX_IMAGES
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
                maxImageSlots: 9
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
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" },
                { value: "4k", label: "4K" }
              ],
              defaultValue: "1080p",
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
