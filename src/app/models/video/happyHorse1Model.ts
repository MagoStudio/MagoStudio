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

const HAPPY_HORSE_1_MAX_IMAGES = 5;
const HAPPY_HORSE_1_MAX_BILLABLE_SECONDS = 15;
const HAPPY_HORSE_1_CREDITS_PER_SECOND_720P = 280;
const HAPPY_HORSE_1_CREDITS_PER_SECOND_1080P = 560;
const HAPPY_HORSE_1_DEFAULT_FPS = 24;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : HAPPY_HORSE_1_DEFAULT_FPS;

  const seconds = Math.min(
    frameRangeLength / fps,
    HAPPY_HORSE_1_MAX_BILLABLE_SECONDS
  );
  const rate =
    renderSettings.resolution === "1080p"
      ? HAPPY_HORSE_1_CREDITS_PER_SECOND_1080P
      : HAPPY_HORSE_1_CREDITS_PER_SECOND_720P;
  const credits = Math.ceil(seconds * rate);

  return { impactToShow: credits };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const {
    image_ids: _image_ids,
    seed: _seed,
    enable_safety_checker: _enableSafetyChecker,
    ...restSettings
  } = settings;

  const referenceFrameAssetIds = referenceFrameAssetIdsFromSources(
    context.sources
  );
  const referenceImageIds =
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
    audio_setting: "origin",
    reference_image_ids: referenceImageIds
  };
};

const formatValuesForFrontend = (values: VideoSettings): VideoSettings => {
  const { reference_image_ids, ...rest } = values;
  return {
    ...rest,
    image_ids: Array.isArray(reference_image_ids) ? reference_image_ids : []
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

export const happyHorse1Model: VideoModelDefinition = {
  name: VideoEngine.happy_horse_1,
  capabilities: {},
  displayName: "Happy Horse 1.0",
  description:
    "Transform your video using reference images with up to 5 image inputs",
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
    modelLimits: { minSeconds: 3, maxSeconds: 15 }
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
              tooltip: "Give instructions using @Image references",
              ui: "Prompt",
              defaultValue: "Change the video into",
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: {
                hideAutoPrompt: true,
                doubleHeight: true
              },
              customValidation: (value, _allValues, sources = []) => {
                if (!value || typeof value !== "string") return null;

                const imageIds = referenceFrameAssetIdsFromSources(sources);

                const referencedNumbers = new Set<number>();
                for (const match of value.matchAll(/@image(\d+)/gi)) {
                  referencedNumbers.add(Number(match[1]));
                }

                for (const n of referencedNumbers) {
                  if (n < 1 || n > HAPPY_HORSE_1_MAX_IMAGES) {
                    return `@Image${n} is not supported (max @Image${HAPPY_HORSE_1_MAX_IMAGES})`;
                  }
                  if (!imageIds[n - 1]) {
                    return `Please add @Image${n} or remove it from your prompt`;
                  }
                }

                return findUnreferencedImageTagError(
                  value,
                  imageIds,
                  HAPPY_HORSE_1_MAX_IMAGES
                );
              }
            },
            {
              key: "image_ids",
              type: "array",
              label: "Reference (up to 5 images)",
              tooltip: "Scenery, style or atmosphere references",
              ui: "MultiImageUploader",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big",
                maxImageSlots: HAPPY_HORSE_1_MAX_IMAGES
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
              key: "resolution",
              type: "enum",
              label: "Resolution",
              tooltip: "Output resolution",
              ui: "SelectInput",
              options: [
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" }
              ],
              defaultValue: "720p",
              nullable: false
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend,
  formatSourcesForBackend,
  formatValuesForFrontend,
  onValueChange
};
