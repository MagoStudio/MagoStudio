import { getDurationFromFrameRange } from "@domains/renders/utils/getDurationFromFrameRange";
import {
  CalcEstimatedRenderTimeFunction,
  ContextValidationResult,
  ModelCategory,
  VideoEngine,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  ValidationContext,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { IMAGE_UPLOAD_LIMITS } from "@utils/image/imageUploadLimits";

import { appendImageTagsToPrompt } from "./appendImageTagsToPrompt";
import { findUnreferencedImageTagError } from "./findUnreferencedImageTagError";
import {
  elementPairAssetIdsFromSources,
  formatElementPairForBackend,
  formatElementPairForFrontend
} from "./formatElementPair";
import { passThroughOwnedSources } from "./passThroughOwnedSources";
import { referenceFrameAssetIdsFromSources } from "./referenceFrameAssetIdsFromSources";

const formatSourcesForBackend = passThroughOwnedSources;

const KLING_O3_CREDITS_PER_SECOND = 258;
const KLING_O3_MAX_IMAGE_SLOTS = 2;
const KLING_O3_MIN_FPS = 24;
const KLING_O3_MAX_FPS = 60;
const KLING_O3_MIN_DIMENSION = 340;
const KLING_O3_MAX_DIMENSION = 3850;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : KLING_O3_MIN_FPS;

  const seconds = frameRangeLength / fps;
  const credits = Math.ceil(seconds * KLING_O3_CREDITS_PER_SECOND);

  return { impactToShow: credits };
};

const validateContext = (
  context: ValidationContext
): ContextValidationResult => {
  const { fps, inputVideoWidth, inputVideoHeight } = context;

  if (fps < KLING_O3_MIN_FPS || fps > KLING_O3_MAX_FPS) {
    return {
      isRenderContextValid: false,
      errorKey: "Video must be between 24fps and 60fps to use Kling 3.0 Edit"
    };
  }

  if (inputVideoWidth && inputVideoHeight) {
    const minSide = Math.min(inputVideoWidth, inputVideoHeight);
    const maxSide = Math.max(inputVideoWidth, inputVideoHeight);

    if (minSide < KLING_O3_MIN_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at least ${KLING_O3_MIN_DIMENSION}px on the smallest side`
      };
    }

    if (maxSide > KLING_O3_MAX_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at most ${KLING_O3_MAX_DIMENSION}px on the largest side`
      };
    }
  }

  return { isRenderContextValid: true };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const {
    reference_image_id: _reference_image_id,
    frontal_image_id: _frontal_image_id,
    image_ids: _image_ids,
    ...restSettings
  } = settings;

  const elements = formatElementPairForBackend(context.sources);

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
    elements,
    image_ids: imageIds
  };
};

const onValueChange = (
  key: string,
  value: unknown,
  currentValues: VideoSettings
): Partial<VideoSettings> | undefined => {
  const prompt = (currentValues.prompt as string) || "";

  if (key === "image_ids" && Array.isArray(value)) {
    const newPrompt = appendImageTagsToPrompt(value as string[], prompt);
    if (newPrompt) {
      return { prompt: newPrompt };
    }
  }

  if (key === "reference_image_id" || key === "frontal_image_id") {
    const referenceId =
      key === "reference_image_id" ? value : currentValues.reference_image_id;
    const frontalId =
      key === "frontal_image_id" ? value : currentValues.frontal_image_id;

    const hasBothImages = !!referenceId && !!frontalId;
    const tag = "@Element1";

    if (hasBothImages && !prompt.includes(tag)) {
      return { prompt: (prompt.trim() + ` ${tag}`).trim() };
    }
  }

  return undefined;
};

const formatValuesForFrontend = (values: VideoSettings): VideoSettings => {
  const { elements, ...rest } = values;

  const elementPair = formatElementPairForFrontend(elements);
  if (!elementPair) return values;

  return { ...rest, ...elementPair };
};

export const klingO3EditProModel: VideoModelDefinition = {
  name: VideoEngine.kling_o3_edit_pro,
  capabilities: {},
  displayName: "Kling O3 Pro",
  description:
    "Transform your video in a variety of ways, using just a prompt or image references",
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
      testRenderSeconds: 3
    },
    modelLimits: { minSeconds: 3, maxSeconds: 10 }
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
              tooltip:
                "Give instructions using the @Image1,2 and @Element1 for better control",
              tooltipImage: "/kling_prompt.png",
              ui: "Prompt",
              specificConfig: { hideAutoPrompt: true, doubleHeight: true },
              defaultValue: "Change the video to match @Image1 style",
              nullable: false,
              errorMessage: "You need to add a prompt",
              customValidation: (value, _allValues, sources = []) => {
                if (!value || typeof value !== "string") return null;

                const imageIds = referenceFrameAssetIdsFromSources(sources);
                const promptLower = value.toLowerCase();

                if (promptLower.includes("@image1") && !imageIds[0]) {
                  return "Please add @Image1 or remove it from your prompt";
                }

                if (promptLower.includes("@image2") && !imageIds[1]) {
                  return "Please add @Image2 or remove it from your prompt";
                }

                const { referenceAssetId, frontalAssetId } =
                  elementPairAssetIdsFromSources(sources);

                if (promptLower.includes("@element1")) {
                  if (!referenceAssetId || !frontalAssetId) {
                    return "Please add @Element1 images or remove it from your prompt";
                  }
                }

                const unreferencedImageError = findUnreferencedImageTagError(
                  value,
                  imageIds,
                  KLING_O3_MAX_IMAGE_SLOTS
                );
                if (unreferencedImageError) {
                  return unreferencedImageError;
                }

                if (
                  referenceAssetId &&
                  frontalAssetId &&
                  !promptLower.includes("@element1")
                ) {
                  return "Add @Element1 to your prompt or remove the element images";
                }

                return null;
              }
            },
            {
              key: "image_ids",
              type: "array",
              label: "Images (jpg or png)",
              tooltip: "Scenery, style or atmosphere references",
              ui: "MultiImageUploader",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big"
              },
              defaultValue: [],
              nullable: true
            },
            {
              key: "reference_image_id",
              secondKey: "frontal_image_id",
              type: "string",
              label: "Element (minimum 2 different angles, jpg or png)",
              tooltip:
                "An element can be a person, an animal or an object that will be included in the video. You need to give 2 different images of the same thing you want to include",
              ui: "TwoAngleImageUploader",
              specificConfig: {
                sourceRoles: ["element_reference", "element_frontal"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big"
              },
              defaultValue: undefined,
              nullable: true,
              customValidation: (_value, _allValues, sources = []) => {
                const { referenceAssetId, frontalAssetId } =
                  elementPairAssetIdsFromSources(sources);
                const hasFirst = !!referenceAssetId;
                const hasSecond = !!frontalAssetId;
                const isValid =
                  (!hasFirst && !hasSecond) || (hasFirst && hasSecond);
                return isValid
                  ? null
                  : "You need to add a second angle, or the generation won't work.";
              }
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend,
  formatSourcesForBackend,
  validateContext,
  onValueChange,
  formatValuesForFrontend
};
