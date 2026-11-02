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
const SCALE_COEFFICIENT = 0.651047;
const SIZE_EXPONENT = 3.15917;
const FRAME_COUNT_EXPONENT = 1;
const STEPS_EXPONENT = 0.833988;
const STARTUP_SECONDS = 40;
const POSE_DEPTH_OVERHEAD = 0.2;
const FACEMESH_BLENDING_OVERHEAD = 0.2;

export const calcMagoV3_4_0RenderTimeSeconds = (
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
    VideoEngine.V3_4_0,
    calcMagoV3_4_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV3_4_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V3_4_0,
  displayName: "Mago Transform",
  description: "High resolution renders for video transformations",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
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
    wireSourceRoles: ["reference_frame", "key_frame"],
    supportsFacemeshBlending: false,
    supportsBulkRendering: true
  },
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
              max: 1620,
              step: 1,
              defaultValue: 1280
            }
          ]
        },
        {
          name: "",
          settings: [
            {
              key: "control_type",
              type: "enum",
              label: "ControlNet type",
              tooltip:
                "Determines what information is extracted from the input video and used to guide the render. Pose follows body movement; Depth captures 3D space; Normal Map captures surface detail; SoftEdge preserves contours. Combined modes (Pose+Depth, SoftEdge+Normal) apply two maps at once for stronger control, at the cost of longer preprocessing.",
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
                "How strongly the control map guides the generation. Lower values give the model more creative freedom; higher values keep the output closer to the input control map information.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
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
                "How strongly the control map guides the generation. Lower values give the model more creative freedom; higher values keep the output closer to the input control map information.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
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
                "How strongly the control map guides the generation. Lower values give the model more creative freedom; higher values keep the output closer to the input control map information.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
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
                "How strongly the control map guides the generation. Lower values give the model more creative freedom; higher values keep the output closer to the input control map information.",
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 1.5,
              step: 0.01,
              defaultValue: 1
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
              key: "firstframe_control_strength",
              type: "number",
              label: "Strength",
              tooltip:
                "How strongly the control map guides the generation. Lower values give the model more creative freedom; higher values keep the output closer to the input control map information.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1.5,
              step: 0.01,
              defaultValue: 0.5
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
              max: 10,
              step: 1,
              defaultValue: 4
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
              key: "v3_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts.",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 160,
              step: 1,
              defaultValue: 120
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
              key: "skip_cnet_preprocess",
              type: "boolean",
              label: "Input video is a control map",
              tooltip:
                "Enable this option if the video you uploaded is a control map. It will then be used directly as the source control map for the generation.",
              ui: "CheckboxInput",
              defaultValue: false
            },
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
              key: "v3_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 24,
              step: 1,
              defaultValue: 4
            },
            {
              key: "dynamic_reference_frame",
              type: "boolean",
              label: "Dynamic reference",
              tooltip:
                "When enabled, a new reference image is generated between render parts, which allows for better transitions for high movement videos. For static/slow movement videos, disabling it ensures better consistency",
              ui: "CheckboxInput",
              defaultValue: false
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
              defaultValue: 1
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
              defaultValue: 2
            },
            {
              key: "long_context_lora_strength",
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
          name: "",
          hidingCondition: (settings) => settings.control_type !== "depth",
          isControlNetDetailSetting: true,
          settings: [
            {
              key: "enable_facemesh_blending",
              type: "boolean",
              label: "Facemesh",
              tooltip:
                "Enables higher fidelity of face expressions and lip-sync",
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
          name: undefined,
          settings: [
            {
              key: "start_frame_buffer_size",
              type: "enum",
              label: "Start frame buffer",
              tooltip:
                "Number of rendered frames from the end of the previous chunk shown to the model as context when starting the next one. Higher values give the model more motion history and produce smoother transitions; lower values are faster but can cause subtle jumps between chunks, especially on fast-moving footage.",
              hidingCondition: (_, isTeamMember) => !isTeamMember,
              ui: "SelectInput",
              options: [
                { value: "1", label: "1" },
                { value: "5", label: "5" }
              ],
              defaultValue: "1"
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
