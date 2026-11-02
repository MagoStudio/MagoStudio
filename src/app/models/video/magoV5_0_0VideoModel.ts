import {
  CalcEstimatedRenderTimeFunction,
  IMAGE_SEQUENCE_EXPORT,
  ModelCategory,
  VideoEngine,
  RenderDurationLimits,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

const FASTMODE_DISCOUNT = 0.3;
const NORMALIZED_SIZE = 1024;
const DEFAULT_FRAME_COUNT = 8;
const SCALE_COEFFICIENT = 0.899727;
const SIZE_EXPONENT = 2.6;
const FRAME_COUNT_EXPONENT = 1;
const STEPS_EXPONENT = 0.601529;
const STARTUP_SECONDS = 30;

export const calcMagoV5_0_0RenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(renderSettings.max_size);
  const steps = toPositiveSettingNumber(renderSettings.steps);

  const perFrameWork =
    SCALE_COEFFICIENT *
    Math.pow(maxSize / NORMALIZED_SIZE, SIZE_EXPONENT) *
    Math.pow(frameCount, FRAME_COUNT_EXPONENT) *
    Math.pow(steps, STEPS_EXPONENT);

  const discountedPerFrameWork = renderSettings.enable_interpolation
    ? perFrameWork * (1 - FASTMODE_DISCOUNT)
    : perFrameWork;

  return discountedPerFrameWork + STARTUP_SECONDS;
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => ({
  impactToShow: calcMagoNativeRenderCredits(
    VideoEngine.V5_0_0,
    calcMagoV5_0_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

const RETIRED_LORA_SETTING_KEY = /^(?:lora_\d+|lora_weight_\w+|custom_loras)$/;

const withoutRetiredLoraSettings = (settings: VideoSettings): VideoSettings =>
  Object.fromEntries(
    Object.entries(settings).filter(
      ([key]) => !RETIRED_LORA_SETTING_KEY.test(key)
    )
  ) as VideoSettings;

export const magoV5_0_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V5_0_0,
  displayName: "Mago Style Transfer",
  description: "Style transfer with great lip-sync and facial expressions",
  type: "render",
  status: "active",
  category: ModelCategory.STYLIZATION,
  modeAvailability: {
    isRelaxedModeAvailable: true
  },
  calcEstimatedRenderTime,
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 99, testRender: 48 },
    modelLimits: {
      minFrames: 8,
      maxFrames: 2000,
      interpolationMinFrames: 24,
      interpolationMaxFrames: 2000
    }
  } satisfies RenderDurationLimits,
  isSourceImageRequired: true,
  isWanModel: true,
  capabilities: {
    wireSourceRoles: ["reference_frame"],
    supportsBulkRendering: true
  },
  formatValuesForBackend: (settings) => {
    const rest = withoutRetiredLoraSettings(settings);

    const steps = (settings.steps as number) ?? 4;
    const splitStepPercentage =
      (settings.split_step_percentage as number) ?? 40;
    const splitStep = Math.round(steps * (1 - splitStepPercentage / 100));

    return {
      ...rest,
      skip_cnet_preprocess: true,
      custom_loras: [],
      split_step_percentage: splitStepPercentage,
      split_step: splitStep
    };
  },
  formatValuesForFrontend: withoutRetiredLoraSettings,
  settingsGroups: [
    {
      name: "Main",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "source_image_slot",
              type: "string",
              label: "Stylize first frame",
              labelCaption: "For this model you need to stylize first frame",
              tooltip:
                "The frame reference style and elements will be applied to the whole render. The frame can be any frame inside the render range",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame", "style_reference"],
                isPrimarySourceSlot: true
              },
              defaultValue: undefined,
              nullable: true
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "The prompt needs to describe the end result of your render, including description of the main characters/elements, visual style information and video movement",
              ui: "Prompt",
              defaultValue: "",
              nullable: true
            },
            {
              key: "negative_prompt",
              type: "string",
              label: "Negative Prompt",
              tooltip:
                "Describe what you do not want to see in the output. It can be specific elements that appear in your results and that you wish to remove, or general concepts related to quality (low resolution, bad anatomy).",
              ui: "Prompt",
              defaultValue: "bad quality, low quality, naked, nude, racy, nsfw",
              hidingCondition: () => true
            }
          ]
        }
      ]
    },
    {
      name: "Technical settings",
      level: "technical",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your target output resolution. Lower resolutions will give faster and cheaper results, at the expense of quality",
              ui: "NumberInputWithLabelInside",
              min: 512,
              max: 3840,
              step: 1,
              defaultValue: 1280
            }
          ]
        }
      ]
    },
    {
      name: "Quality settings",
      level: "quality",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Total number of diffusion steps. More steps give sharper, more detailed results, but take longer to render; very high values can over-sharpen the image or push colors too far.",
              ui: "SliderAndNumberInput",
              min: 4,
              max: 20,
              step: 1,
              defaultValue: 4
            },
            {
              key: "split_step_percentage",
              type: "number",
              label: "Level of details",
              tooltip:
                "Controls the level of detail of the generation. A higher number will help render finer details and textures",
              ui: "SliderAndNumberInput",
              min: 20,
              max: 80,
              step: 10,
              defaultValue: 40,
              specificConfig: { unit: "%" }
            },
            {
              key: "raw_video_cn_strength",
              type: "number",
              label: "Video input strength",
              tooltip:
                "The higher the value, the higher the fidelity to the original input video will be (shape, facial expressions, lip-sync, outlines, etc.).",
              ui: "SliderAndNumberInput",
              min: 0.3,
              max: 1,
              step: 0.1,
              defaultValue: 0.5
            },
            {
              key: "enable_interpolation",
              type: "boolean",
              label: "Interpolation",
              tooltip:
                "Renders every other frame and fills in the rest. Cuts render time and allows larger context size, at the cost of quality in some cases.",
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "v5_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts.",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 600,
              step: 1,
              defaultValue: 300
            }
          ]
        }
      ]
    },
    {
      name: "Advanced settings",
      level: "advanced",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "image_sequence_export",
              type: "enum",
              label: "Images format",
              tooltip: "Output format for the render as an image sequence.",
              ui: "SelectInput",
              options: [
                { value: IMAGE_SEQUENCE_EXPORT.PNG, label: "PNG" },
                { value: IMAGE_SEQUENCE_EXPORT.EXR_16BIT, label: "EXR 16-bit" }
              ],
              defaultValue: IMAGE_SEQUENCE_EXPORT.PNG
            }
          ]
        },
        {
          name: "Prompt influence",
          settings: [
            {
              key: "cfg",
              type: "number",
              label: "Prompt strength",
              tooltip:
                "Higher values will enforce more strongly the prompt instructions. A value too high might result in visual artifacts.",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 6,
              step: 0.1,
              defaultValue: 1
            }
          ]
        },
        {
          name: "Context settings",
          settings: [
            {
              key: "v5_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 24,
              step: 1,
              defaultValue: 10
            },
            {
              key: "dynamic_reference_frame",
              type: "boolean",
              label: "Dynamic reference",
              tooltip:
                "When enabled, a new reference image is generated between render parts, which allows for better transitions for high movement videos. For static/slow movement videos, disabling it ensures better consistency",
              ui: "CheckboxInput",
              defaultValue: true
            }
          ]
        },
        {
          name: "Other",
          settings: [
            {
              key: "keyframe_index",
              type: "number",
              label: "Keyframe Index",
              tooltip: "Frame index to use as reference",
              ui: "hidden",
              defaultValue: undefined,
              nullable: true
            },
            {
              key: "color_match_strength",
              type: "number",
              label: "Color consistency",
              tooltip:
                "Help the render to follow the color palette of the stylized frame reference. Increase the value if the render color is too different from the frame reference and/or if there is some color drifting. Decrease the value when you work on dynamic scenes.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0
            },
            {
              key: "shift",
              type: "number",
              label: "Shift",
              tooltip:
                "Higher values favor overall composition and large shapes; lower values favor fine detail such as detailed textures.",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 10,
              step: 1,
              defaultValue: 8
            },
            {
              key: "low_step_accelerator",
              type: "number",
              label: "Accelerator",
              tooltip:
                "Higher values accelerate render times for faster renders. Might reduce detail and color fidelity at high values.",
              tooltipImage: "/lowstep.png",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 1
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
        },
        {
          name: undefined,
          settings: [
            {
              key: "bypass_tiling",
              type: "boolean",
              label: "Bypass tile sampler",
              tooltip:
                "When enabled, the tile sampler is bypassed during rendering. The tile sampler allows longer context sizes and higher output resolutions.",
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "Warm up settings",
          hidingCondition: (_, isTeamMember) => !isTeamMember,
          settings: [
            {
              key: "enable_warm_up",
              type: "boolean",
              label: "Enable warmup",
              tooltip:
                "Enable warmup to let the reference image conform better to the first frame before the video actually starts.",
              ui: "CheckboxInput",
              defaultValue: true
            },
            {
              key: "warm_up_size",
              type: "number",
              label: "Warmup size",
              tooltip:
                "Size of the warm up. The higher the value, the more frames will be used for the warm up.",
              ui: "NumberInput",
              min: 4,
              max: 20,
              step: 1,
              defaultValue: 16
            },
            {
              key: "warm_up_type",
              type: "enum",
              label: "Warmup type",
              tooltip:
                "Enable warm up to let the reference image conform better to the first frame before the video actually starts.",
              ui: "SelectInput",
              options: [
                { value: "first_frame", label: "First frame" },
                { value: "ping_pong", label: "Ping pong" }
              ],
              defaultValue: "ping_pong"
            }
          ]
        }
      ]
    }
  ]
} as const;
