import {
  CalcEstimatedRenderTimeFunction,
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
const SCALE_COEFFICIENT = 0.651047;
const SIZE_EXPONENT = 3.15917;
const FRAME_COUNT_EXPONENT = 1;
const STEPS_EXPONENT = 0.833988;
const STARTUP_SECONDS = 40;
const POSE_DEPTH_OVERHEAD = 0.2;
const FACEMESH_BLENDING_OVERHEAD = 0.2;

export const calcMagoV3_2_0RenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(renderSettings.max_size);
  const steps = toPositiveSettingNumber(renderSettings.steps);

  const controlOverhead =
    1 +
    (renderSettings.control_type === "pose_depth" ? POSE_DEPTH_OVERHEAD : 0) +
    (renderSettings.enable_facemesh_blending ? FACEMESH_BLENDING_OVERHEAD : 0);

  const perFrameWork =
    SCALE_COEFFICIENT *
    Math.pow(maxSize / NORMALIZED_SIZE, SIZE_EXPONENT) *
    Math.pow(frameCount, FRAME_COUNT_EXPONENT) *
    Math.pow(steps, STEPS_EXPONENT) *
    controlOverhead;

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
    VideoEngine.V3_2_0,
    calcMagoV3_2_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV3_2_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V3_2_0,
  displayName: "Mago V3.2 (deprecated)",
  description: "High quality renders for long clips",
  type: "render",
  status: "deprecated",
  modeAvailability: {
    isRelaxedModeAvailable: true
  },
  calcEstimatedRenderTime,
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 48, testRender: 24 },
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
    supportsFacemeshBlending: true
  },
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
              label: "Stylize first frame",
              labelCaption: "For this model you need to stylize first frame",
              tooltip:
                "The frame reference style and elements will be applied to the whole render. The frame can be any frame inside the render range",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
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
      name: "Controlnets",
      level: "advanced",
      sections: [
        {
          name: "",
          settings: [
            {
              key: "control_type",
              type: "enum",
              label: "Type",
              ui: "SelectInput",
              options: [
                { value: "depth", label: "Depth" },
                {
                  value: "normal_map",
                  label: "Normal Map (beta)"
                },
                { value: "pose", label: "Pose" },
                {
                  value: "softedge",
                  label: "SoftEdge (beta)"
                }
              ],
              tooltip:
                "Select a controlNet based on your use case. For character replacement, Pose is best. For stylization or landscape modifications Depth is best. Normal maps and Softedge can help when Depth is not working well.",
              defaultValue: "depth"
            },
            {
              key: "cn_depth_resolution",
              type: "number",
              label: "Depth resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024,
              hidingCondition: (settings) => settings.control_type !== "depth"
            },
            {
              key: "cn_normal_map_resolution",
              type: "number",
              label: "Normal map resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024,
              hidingCondition: (settings) =>
                settings.control_type !== "normal_map"
            },
            {
              key: "cn_pose_resolution",
              type: "number",
              label: "Pose resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024,
              hidingCondition: (settings) => settings.control_type !== "pose"
            },
            {
              key: "cn_softedge_resolution",
              type: "number",
              label: "SoftEdge resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024,
              hidingCondition: (settings) =>
                settings.control_type !== "softedge"
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "Defines how strongly the controlnet is used in the generation. Higher values ensure higher fidelity to video input",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "firstframe_control_start",
              secondKey: "firstframe_control_end",
              type: "number",
              label: "Active range",
              tooltip:
                "Defines the range of frames to apply in the diffusion process (0-1 range).",
              ui: "RangeToStartEndInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0,
              secondDefaultValue: 1
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip:
                "Enables higher fidelity of face expressions and lip-sync",
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "shift",
              type: "number",
              label: "Shift",
              tooltip:
                "Controls the frame shift amount for temporal alignment. Higher values increase the search range for matching features.",
              ui: "SliderAndNumberInput",
              min: 0.001,
              max: 10,
              step: 1,
              defaultValue: 1
            },
            {
              key: "long_context_lora_strength",
              type: "number",
              label: "Low-Step Accelerator",
              tooltip:
                "Higher values allow faster video generation with fewer steps, but might result in style/color degradation. Adjust to balance speed and quality.",
              tooltipImage: "/lowstep.png",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.5
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
          name: "Quality Settings",
          settings: [
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your  target output resolution. Lower resolutions will give faster and cheaper results, at the expense of quality",
              ui: "NumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Total diffusion steps: more steps result in sharper and more detailed results but slower processing. Lower steps can help achieving less refined styles.",
              ui: "SliderAndNumberInput",
              min: 4,
              max: 16,
              step: 1,
              defaultValue: 8
            },
            {
              key: "enable_interpolation",
              type: "boolean",
              label: "Interpolation",
              tooltip:
                "The interpolation mode renders only one every two frames and use interpolation to fill in the gaps. As a result, the render is quicker and costs less credits. The output might be less detailed in occasions.",
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "Prompt influence",
          settings: [
            {
              key: "cfg",
              type: "number",
              label: "CFG",
              tooltip:
                "The CFG is the prompt strength. Higher values will enforce more strongly the prompt instructions. A value too high might result in visual artefacts.",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 6,
              step: 0.1,
              defaultValue: 1
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
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.3
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
          name: "Context settings",
          settings: [
            {
              key: "v3_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 120,
              step: 1,
              defaultValue: 80
            },
            {
              key: "v3_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 24,
              step: 1,
              defaultValue: 4
            },
            {
              key: "dynamic_reference_frame",
              type: "boolean",
              label: "Dynamic reference",
              tooltip:
                "When enabled, a new reference image is generated between render parts, which allows for better transitions for high movement videos. For static/slow movement videos, disabling it ensure better consistency",
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
              max: 8,
              step: 1,
              defaultValue: 4
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
