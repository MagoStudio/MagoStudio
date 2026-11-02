import {
  CalcEstimatedRenderTimeFunction,
  ModelCategory,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

const NORMALIZED_SIZE = 1024;
const DEFAULT_FRAME_COUNT = 8;
const SCALE_COEFFICIENT = 1.89442;
const SIZE_EXPONENT = 1;
const FRAME_COUNT_EXPONENT = 1;
const STARTUP_SECONDS = 30;

export const calcMagoV8_0_0RenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(renderSettings.max_size);

  const perFrameWork =
    SCALE_COEFFICIENT *
    Math.pow(maxSize / NORMALIZED_SIZE, SIZE_EXPONENT) *
    Math.pow(frameCount, FRAME_COUNT_EXPONENT);

  return perFrameWork + STARTUP_SECONDS;
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => ({
  impactToShow: calcMagoNativeRenderCredits(
    VideoEngine.V8_0_0,
    calcMagoV8_0_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV8_0_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V8_0_0,
  capabilities: {},
  displayName: "Mago Clean Plate",
  description: "Removes subjects and reconstructs the empty background",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
  modeAvailability: {
    isRelaxedModeAvailable: true
  },
  calcEstimatedRenderTime,
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 99, testRender: 48 },
    modelLimits: { minFrames: 8, maxFrames: 2000 }
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
              key: "lora_name",
              type: "enum",
              label: "Model variant",
              tooltip: "Choose which processing variant to use for this render",
              ui: "SelectInput",
              options: [
                {
                  value: "ltx-2.3-22b-ic-lora-clean-plate-1.0.safetensors",
                  label: "Clean plate"
                },
                {
                  value: "ltx-2.3-22b-ic-lora-deblur-0.9.safetensors",
                  label: "Deblur"
                },
                {
                  value:
                    "LTX2.3-22B_IC-LoRA-CrossView-Prompt_v0.9_13700.safetensors",
                  label: "Cross-view"
                },
                {
                  value: "LTX23_Obscura_Remova_v1.safetensors",
                  label: "Obscura removal"
                }
              ],
              defaultValue: "ltx-2.3-22b-ic-lora-clean-plate-1.0.safetensors",
              nullable: false
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "Describe the empty background you want reconstructed once the subjects are removed",
              ui: "Prompt",
              defaultValue:
                "An empty clean plate of the exact same scene. no moving objects, cars, no animals, no figures, and no body parts such as heads, arms, hands or legs anywhere in the frame, or in the background.\nNo cast shadows or reflections of people",
              nullable: true
            },
            {
              key: "negative_prompt",
              type: "string",
              label: "Negative Prompt",
              tooltip:
                "Describe what you do not want to see in the output. It can be specific elements that appear in your results and that you wish to remove, or general concepts related to quality (low resolution, bad anatomy).",
              ui: "Prompt",
              defaultValue: "people, silhouettes, moving objects",
              hidingCondition: () => true
            },
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your target output resolution. Lower resolutions will give faster and cheaper results, at the expense of quality",
              ui: "NumberInput",
              min: 512,
              max: 1920,
              step: 1,
              defaultValue: 1280
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
          name: "Context settings",
          settings: [
            {
              key: "v8_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 81,
              step: 1,
              defaultValue: 81
            },
            {
              key: "v8_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 24,
              step: 1,
              defaultValue: 1
            }
          ]
        }
      ]
    }
  ]
};
