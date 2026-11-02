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

const CHARACTER_ONLY_FIT = {
  scaleCoefficient: 0.1961,
  sizeExponent: 2.931,
  frameCountExponent: 1.1736,
  stepsExponent: 1.132,
  startupSeconds: 70
};

const KEEP_BACKGROUND_FIT = {
  scaleCoefficient: 0.274091,
  sizeExponent: 3.65341,
  frameCountExponent: 1,
  stepsExponent: 0.989919,
  startupSeconds: 280
};

export const calcMagoV4_0_0RenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const fit = renderSettings.keep_background
    ? KEEP_BACKGROUND_FIT
    : CHARACTER_ONLY_FIT;
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(renderSettings.max_size);
  const steps = toPositiveSettingNumber(renderSettings.steps);

  const perFrameWork =
    fit.scaleCoefficient *
    Math.pow(maxSize / NORMALIZED_SIZE, fit.sizeExponent) *
    Math.pow(frameCount, fit.frameCountExponent) *
    Math.pow(steps, fit.stepsExponent);

  const discountedPerFrameWork = renderSettings.enable_interpolation
    ? perFrameWork * (1 - FASTMODE_DISCOUNT)
    : perFrameWork;

  return discountedPerFrameWork + fit.startupSeconds;
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => ({
  impactToShow: calcMagoNativeRenderCredits(
    renderSettings.keep_background ? VideoEngine.V4_1_0 : VideoEngine.V4_0_0,
    calcMagoV4_0_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV4_0_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V4_0_0,
  displayName: "Mago character",
  displayNameDetails: "chara only",
  description:
    "Replace your character in any kind of scene, with or without a new background",
  type: "render",
  status: "active",
  category: ModelCategory.CHARACTER_REPLACEMENT,
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
              label: "Set your character reference",
              labelCaption:
                "For this model, you need an image with the character you want to animate",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true,
                stylizeButtonLabel: "Generate your character",
                uploadButtonLabel: "Upload character reference"
              },
              tooltip:
                "Upload or generate a character reference. It doesn't have to follow the pose or scenery of your input video",
              ui: "FileUploaderWithStylizeButton",
              defaultValue: undefined,
              nullable: true
            },
            {
              key: "keep_background",
              type: "boolean",
              label: "Use image background",
              tooltip:
                "When enabled, the background of the image reference will be used for the render",
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip:
                "The prompt needs to describe the end result of your render. Simpler prompts usually yields better results",
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
              defaultValue:
                "Vivid tones, overexposed, static, blurry details, subtitles, work, still image, overall grayish, worst quality, low quality, JPEG compression artifacts, ugly, defective, extra fingers, poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, fused fingers, motionless image, messy background, three legs, crowded background, walking backwards",
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
              max: 30,
              step: 1,
              defaultValue: 5
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
              key: "pose_strength",
              type: "number",
              label: "Pose strength",
              tooltip:
                "Defines how strongly the original character pose is used in the final output. A value too high might create artefacts.",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 1.5,
              step: 0.1,
              defaultValue: 1
            },
            {
              key: "face_strength",
              type: "number",
              label: "Face strength",
              tooltip:
                "Defines how strongly the original character facial expressions are used in the final output. A value too high might generate a stiffer face.",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 1.5,
              step: 0.1,
              defaultValue: 1
            }
          ]
        },
        {
          name: "Mask",
          hidingCondition: (settings) => settings.keep_background === true,
          settings: [
            {
              key: "masking_prompt",
              type: "string",
              label: "Masking prompt",
              tooltip:
                "Text description of the character you want to replace. Being more precise helps selecting the right character in multi-character scenes.",
              ui: "TextInput",
              defaultValue: "character"
            }
          ]
        },
        {
          name: undefined,
          settings: [
            {
              key: "v4_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts.",
              ui: "SliderAndNumberInput",
              min: 0,
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
          name: "Mask",
          hidingCondition: (settings) => settings.keep_background === true,
          settings: [
            {
              key: "grow_mask_expand",
              type: "number",
              label: "Grow Mask",
              tooltip:
                "Number of pixels added to the mask borders. Increase this value to include elements that are sticking out of the main shape of the original character you want to replace (pointy hair, accessories, etc.).",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 50,
              step: 1,
              defaultValue: 10
            }
          ]
        },
        {
          name: "Context settings",
          settings: [
            {
              key: "v4_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 10,
              step: 1,
              defaultValue: 1
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
          name: "Animate",
          settings: [
            {
              key: "crop_padding",
              type: "number",
              label: "Grow face mask",
              tooltip:
                "Margin around the face area added to the face detection to include potentially overlapping facial features of the input video character (big eyebrows, long chin, etc.)",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 200,
              step: 1,
              defaultValue: 50
            }
          ]
        },
        {
          name: "Mask",
          hidingCondition: (settings) => settings.keep_background === true,
          settings: [
            {
              key: "masking_threshold",
              type: "number",
              label: "Masking threshold",
              tooltip:
                'Sensitivity level of the mask. The lower the threshold, the more "inclusive" is the mask: it is good to replace complex characters, but can lead to the inclusion of unwanted elements.',
              ui: "SliderAndNumberInput",
              min: 0.1,
              max: 0.9,
              step: 0.1,
              defaultValue: 0.3
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
          name: "Other",
          settings: [
            {
              key: "relight",
              type: "number",
              label: "Relight",
              tooltip:
                "How strongly the new character's lighting is changed to match the background. High value = new character lighting fully adapts to the environment; Low = it keeps the lighting from the character reference.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1.5,
              step: 0.1,
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
              defaultValue: 5
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
              max: 1.5,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "colormatch",
              type: "boolean",
              label: "Color correction",
              tooltip:
                "Turn it on if the colors of your render become too saturated and/or over-exposed",
              ui: "CheckboxInput",
              defaultValue: false
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
              key: "temporal_window_size",
              type: "number",
              label: "Temporal Windows Size",
              ui: "SliderAndNumberInput",
              min: 10,
              max: 100,
              step: 1,
              defaultValue: 77,
              hidingCondition: () => true
            }
          ]
        }
      ]
    }
  ],
  onValueChange: (key, value) => {
    if (key === "keep_background") {
      return {
        mago_engine: value ? VideoEngine.V4_1_0 : VideoEngine.V4_0_0
      };
    }
    return undefined;
  },
  formatValuesForFrontend: (values) => {
    return {
      ...values,
      keep_background: false,
      mago_engine: VideoEngine.V4_0_0
    };
  },
  formatValuesForBackend: (settings) => {
    return {
      ...settings,
      mago_engine: settings.keep_background
        ? VideoEngine.V4_1_0
        : VideoEngine.V4_0_0
    };
  }
};
