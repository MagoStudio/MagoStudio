import { snapShotFrames } from "@domains/scriptProject/utils/snapShotFrames";
import {
  CalcEstimatedRenderTimeFunction,
  ModelCategory,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";
import { IMAGE_UPLOAD_LIMITS } from "@utils/image/imageUploadLimits";

import { passThroughOwnedSources } from "./passThroughOwnedSources";

const MINIMAX_REFERENCE_MAX_REF_IMAGES = 9;

const MAGO_V9_NORMALIZED_SIZE_PX = 1024;
const MAGO_V9_SCALE_COEFFICIENT = 2.18951;
const MAGO_V9_SIZE_EXPONENT = 2.22872;
const MAGO_V9_FRAME_COUNT_EXPONENT = 1;
const MAGO_V9_FIXED_OVERHEAD_SECONDS = 60;

export const calcMagoV9RenderTimeSeconds = ({
  longEdgePx,
  requestedFrameCount
}: {
  longEdgePx: number;
  requestedFrameCount: number;
}): number => {
  const billedFrameCount = snapShotFrames(requestedFrameCount);

  return (
    MAGO_V9_SCALE_COEFFICIENT *
      Math.pow(longEdgePx / MAGO_V9_NORMALIZED_SIZE_PX, MAGO_V9_SIZE_EXPONENT) *
      Math.pow(billedFrameCount, MAGO_V9_FRAME_COUNT_EXPONENT) +
    MAGO_V9_FIXED_OVERHEAD_SECONDS
  );
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const frameRangeEndMinusStart = frameRangeLength - 1;

  return {
    impactToShow: calcMagoNativeRenderCredits(
      VideoEngine.minimax_reference,
      calcMagoV9RenderTimeSeconds({
        longEdgePx: toPositiveSettingNumber(renderSettings.max_size),
        requestedFrameCount: frameRangeEndMinusStart
      })
    )
  };
};

export const minimaxReferenceVideoModel: VideoModelDefinition = {
  name: VideoEngine.minimax_reference,
  capabilities: {
    supportsVideoReferenceToggle: true
  },
  displayName: "MiniMax Reference",
  description:
    "Condition a render on any mix of reference images and your source video, or on the prompt alone",
  type: "render",
  status: "hidden",
  category: ModelCategory.TRANSFORMATION_VFX,
  modeAvailability: {
    isRelaxedModeAvailable: false
  },
  disableDownload: ["frames", "video+frames"],
  extraKeys: {
    save_exr: false
  },
  calcEstimatedRenderTime,
  renderDurationLimits: {
    defaultFrameRange: {
      defaultRenderSeconds: 5,
      testRenderSeconds: 4
    },
    modelLimits: { minSeconds: 1, maxSeconds: 15 }
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
                "Describe your render. Use the Optimize prompt button to rewrite it with <Picture n> and <Video n> reference tags.",
              ui: "PromptWithAdaptI2vButton",
              defaultValue: "",
              nullable: false,
              errorMessage: "You need to add a prompt",
              specificConfig: {
                hideAutoPrompt: true,
                doubleHeight: true
              }
            },
            {
              key: "image_ids",
              type: "array",
              label: "Reference (up to 9 images)",
              tooltip: "Character, scenery, style or atmosphere references",
              ui: "MultiImageUploader",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                maxFileSizeBytes: IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
                minDimension: IMAGE_UPLOAD_LIMITS.minDimension,
                maxDimension: IMAGE_UPLOAD_LIMITS.maxDimension,
                errorKeyTooSmall: "upload_button_image_input_too_small",
                errorKeyTooBig: "upload_button_image_input_too_big",
                maxImageSlots: MINIMAX_REFERENCE_MAX_REF_IMAGES
              },
              defaultValue: [],
              nullable: true
            },
            {
              key: "use_video_reference",
              type: "boolean",
              label: "Use video reference",
              tooltip:
                "Feed this shot's source video to the model as a reference. Turn off for a prompt- and image-only render.",
              ui: "SwitchInput",
              defaultValue: true,
              nullable: false
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
              key: "use_video_audio",
              type: "boolean",
              label: "Use source audio",
              tooltip:
                "Carry each reference video's own soundtrack into the render. Turn off to let the model invent a soundtrack instead.",
              ui: "SwitchInput",
              defaultValue: true,
              nullable: false,
              hidingCondition: (settings) => !settings.use_video_reference
            },
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your target output resolution. Lower resolutions give faster, cheaper results at the expense of quality.",
              ui: "NumberInputWithLabelInside",
              min: 512,
              max: 2048,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "seed",
              type: "number",
              label: "Seed",
              tooltip:
                "Random number that will be the starting point of the generation. Try different values for slight variations.",
              ui: "NumberInputFullWidth",
              min: 0,
              max: 2 ** 32 - 1,
              step: 1,
              defaultValue: 42
            }
          ]
        }
      ]
    }
  ],
  formatSourcesForBackend: passThroughOwnedSources
};
