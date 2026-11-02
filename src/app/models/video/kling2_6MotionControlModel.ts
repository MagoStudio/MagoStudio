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

import { passThroughOwnedSources } from "./passThroughOwnedSources";

const formatSourcesForBackend = passThroughOwnedSources;

const KLING_26_CREDITS_PER_SECOND = 172;
const KLING_26_MIN_FPS = 24;
const KLING_26_MAX_FPS = 60;
const KLING_26_MIN_DIMENSION = 340;
const KLING_26_MAX_DIMENSION = 3850;

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const fps =
    typeof renderSettings.fps === "number"
      ? renderSettings.fps
      : KLING_26_MIN_FPS;

  const seconds = frameRangeLength / fps;
  const credits = Math.ceil(seconds * KLING_26_CREDITS_PER_SECOND);

  return { impactToShow: credits };
};

const validateContext = (
  context: ValidationContext
): ContextValidationResult => {
  const { fps, inputVideoWidth, inputVideoHeight } = context;

  if (fps < KLING_26_MIN_FPS || fps > KLING_26_MAX_FPS) {
    return {
      isRenderContextValid: false,
      errorKey: "Video must be between 24fps and 60fps to use Kling 2.6"
    };
  }

  if (inputVideoWidth && inputVideoHeight) {
    const minSide = Math.min(inputVideoWidth, inputVideoHeight);
    const maxSide = Math.max(inputVideoWidth, inputVideoHeight);

    if (minSide < KLING_26_MIN_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at least ${KLING_26_MIN_DIMENSION}px on the smallest side`
      };
    }

    if (maxSide > KLING_26_MAX_DIMENSION) {
      return {
        isRenderContextValid: false,
        errorKey: `Video must be at most ${KLING_26_MAX_DIMENSION}px on the largest side`
      };
    }
  }

  return { isRenderContextValid: true };
};

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => {
  const motionReferenceAssetId = context.sources.find(
    (source) => source.type === "motion_reference"
  )?.asset_id;

  return {
    ...settings,
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
    keep_original_sound: true
  };
};

const formatValuesForFrontend = (values: VideoSettings): VideoSettings => {
  const { image_id: _image_id, ...rest } = values;

  return rest;
};

export const kling2_6MotionControlModel: VideoModelDefinition = {
  name: VideoEngine.kling_2_6_motion_control,
  capabilities: {},
  displayName: "Kling 2.6 Motion Control Pro",
  description:
    "Replace your character with great lip-sync and facial expressions",
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
