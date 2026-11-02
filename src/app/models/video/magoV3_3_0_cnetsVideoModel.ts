import {
  CalcEstimatedRenderTimeFunction,
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
const SCALE_COEFFICIENT = 0.651047;
const SIZE_EXPONENT = 3.15917;
const FRAME_COUNT_EXPONENT = 1;
const STEPS_EXPONENT = 0.833988;
const STARTUP_SECONDS = 40;
const POSE_DEPTH_OVERHEAD = 0.2;
const FACEMESH_BLENDING_OVERHEAD = 0.2;

export const calcMagoV3_3_0CnetsRenderTimeSeconds = (
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
    VideoEngine.V3_3_0_CNETS,
    calcMagoV3_3_0CnetsRenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV3_3_0_cnetsRenderModel: VideoModelDefinition = {
  name: VideoEngine.V3_3_0_CNETS,
  displayName: "Mago 3.3 (FF)",
  description: "Fast renders for video transformations",
  type: "render",
  status: "team_only",
  category: ModelCategory.PRIVATE,
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
    supportsFacemeshBlending: false
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
              tooltip: "Write the prompt here",
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
              label: "ControlNet",
              tooltip:
                'How ControlNets Work\n• ControlNets extract key information from your video, such as outlines, depth.\n• When you stylize or modify your image or video, the AI uses that information to keep the new version consistent with the original.\n• You can view the CN maps to understand how the AI "sees" your video. This can help you spot and fix AI hallucinations or visual glitches.',
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "ControlNetTypeSelector",
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
                },
                {
                  value: "pose_depth",
                  label: "Pose+Depth"
                }
              ],
              defaultValue: "depth"
            }
          ]
        },
        {
          name: "",
          hidingCondition: (settings) => settings.control_type !== "depth",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "cn_depth_resolution",
              type: "number",
              label: "Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "SliderAndNumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip: "Enables facemesh blending",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "",
          hidingCondition: (settings) => settings.control_type !== "normal_map",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "cn_normal_map_resolution",
              type: "number",
              label: "Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "SliderAndNumberInput",
              min: 512,
              max: 768,
              step: 1,
              defaultValue: 512
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip: "Enables facemesh blending",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "",
          hidingCondition: (settings) => settings.control_type !== "pose",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "cn_pose_resolution",
              type: "number",
              label: "Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "SliderAndNumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip: "Enables facemesh blending",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "",
          hidingCondition: (settings) => settings.control_type !== "softedge",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "cn_softedge_resolution",
              type: "number",
              label: "Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "SliderAndNumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip: "Enables facemesh blending",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "",
          hidingCondition: (settings) => settings.control_type !== "pose_depth",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "cn_pose_depth_resolution",
              type: "number",
              label: "Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "SliderAndNumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1280
            },
            {
              key: "pose_depth_control_strength",
              type: "number",
              label: "Pose Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 0.5
            },
            {
              key: "firstframe_control_strength",
              type: "number",
              label: "Depth Strength",
              tooltip:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1.5,
              step: 0.01,
              defaultValue: 0.5
            },
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip: "Enables facemesh blending",
              hidingCondition: (settings) =>
                settings.skip_cnet_preprocess === true,
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "",
          settings: [
            {
              key: "skip_cnet_preprocess",
              type: "boolean",
              label: "Input video is a control map",
              tooltip: "Use input video as control map without preprocessing.",
              ui: "CheckboxInput",
              defaultValue: false
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
                "Size of the longest side of your target output resolution. With FF models, you will not get better results above 1280px. Lowering resolution can still give good results.",
              ui: "NumberInput",
              min: 512,
              max: 1280,
              step: 1,
              defaultValue: 1024
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
              defaultValue: 7
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
                "The higher the CFG (prompt strength), the more impactful will be the prompt on the stylization process. Make sure to decrease the image weight first to ensure the prompt is taken into account, and try to stay within 2 to 3 for most results.",
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
            },
            {
              key: "shift",
              type: "number",
              label: "Shift",
              tooltip:
                "Controls the frame shift amount for temporal alignment. Higher values increase the search range for matching features.",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 10,
              step: 1,
              defaultValue: 5
            },
            {
              key: "long_context_lora_strength",
              type: "number",
              label: "Low-Step Accelerator",
              tooltip:
                "Controls the strength of the Low-Step Accelerator LoRA. Higher values allow faster video generation with fewer steps, while preserving output quality and fidelity. Adjust to balance speed and detail.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.5
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
                "Size of the context window for the generation. Lower values generate faster and keep the style better but will lose context from the previous frames.",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 200,
              step: 1,
              defaultValue: 120
            },
            {
              key: "v3_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Overlap between context windows. Helps reduce sharp transitions between frames.",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 24,
              step: 1,
              defaultValue: 1
            },
            {
              key: "dynamic_reference_frame",
              type: "boolean",
              label: "Dynamic reference",
              tooltip:
                "When enabled, the reference frame is updated at the start of each context window instead of reusing the first stylized frame as a global style reference. This is useful when the input video camera motion and objects appearing and disappearing, but not for static videos.",
              ui: "CheckboxInput",
              defaultValue: true
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
