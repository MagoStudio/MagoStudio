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

import {
  elementPairAssetIdsFromSources,
  formatElementPairForBackend,
  formatElementPairForFrontend
} from "./formatElementPair";
import { passThroughOwnedSources } from "./passThroughOwnedSources";

const formatSourcesForBackend = passThroughOwnedSources;

const KLING_3_CREDITS_PER_SECOND = 258;
const KLING_3_MIN_FPS = 24;
const KLING_3_MAX_FPS = 60;
const KLING_3_MIN_DIMENSION = 340;
const KLING_3_MAX_DIMENSION = 3850;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : KLING_3_MIN_FPS;

  const seconds = frameRangeLength / fps;
  const credits = Math.ceil(seconds * KLING_3_CREDITS_PER_SECOND);

  return { impactToShow: credits };
};

const validateContext = (
  context: ValidationContext
): ContextValidationResult => {
  const { fps, inputVideoWidth, inputVideoHeight } = context;

  if (fps < KLING_3_MIN_FPS || fps > KLING_3_MAX_FPS) {
    return {
      isRenderContextValid: false,
      errorKey: "Video must be between 24fps and 60fps to use Kling 3.0"
    };
  }

  if (inputVideoWidth && inputVideoHeight) {
    const minSide = Math.min(inputVideoWidth, inputVideoHeight);
    const maxSide = Math.max(inputVideoWidth, inputVideoHeight);

    if (minSide < KLING_3_MIN_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at least ${KLING_3_MIN_DIMENSION}px on the smallest side`
      };
    }

    if (maxSide > KLING_3_MAX_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at most ${KLING_3_MAX_DIMENSION}px on the largest side`
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
    ...restSettings
  } = settings;

  const motionReferenceAssetId = context.sources.find(
    (source) => source.type === "motion_reference"
  )?.asset_id;

  const elements = formatElementPairForBackend(context.sources);

  return {
    ...restSettings,
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
    image_id: motionReferenceAssetId,
    character_orientation: "video",
    keep_original_sound: true,
    ...(elements && { elements })
  };
};

const formatValuesForFrontend = (values: VideoSettings): VideoSettings => {
  const { image_id: _image_id, elements, ...rest } = values;

  const base: VideoSettings = { ...rest };

  const elementPair = formatElementPairForFrontend(elements);
  if (!elementPair) return base;

  return { ...base, ...elementPair };
};

export const kling3_0MotionControlModel: VideoModelDefinition = {
  name: VideoEngine.kling_3_motion_control,
  capabilities: {},
  displayName: "Kling 3.0 Motion Control",
  description:
    "Replace your character with great lip-sync and facial expressions, with optional element references",
  type: "render",
  status: "active",
  category: ModelCategory.CHARACTER_REPLACEMENT,
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
    modelLimits: { minSeconds: 3, maxSeconds: 30 }
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
              key: "source_image_slot",
              type: "string",
              label: "Character input",
              labelCaption: "Upload a character image for motion control",
              tooltip:
                "The character image will be used as reference for motion control",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["motion_reference"],
                isPrimarySourceSlot: true,
                uploadButtonLabel: "Upload image reference",
                uploadButtonSubtitle: "Format .jpg or .png"
              },
              defaultValue: undefined,
              nullable: false,
              errorMessage: "You need to add a character image"
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "Keep the prompt empty at first, add a prompt only if you need specific changes",
              ui: "Prompt",
              defaultValue: "",
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
  formatValuesForFrontend
};
