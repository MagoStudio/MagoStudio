import {
  CalcEstimatedRenderTimeFunction,
  IMAGE_SEQUENCE_EXPORT,
  ModelCategory,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

const hasNoReferenceFrame = (settings: Record<string, any>): boolean =>
  !settings.source_image_slot;

const FASTMODE_DISCOUNT = 0.3;
const NORMALIZED_SIZE = 1024;
const DEFAULT_FRAME_COUNT = 8;
const DEFAULT_TOTAL_STEPS = 6;
const DEFAULT_MAX_SIZE = 1280;
const SCALE_COEFFICIENT = 0.561771;
const SIZE_EXPONENT = 3.7;
const FRAME_COUNT_EXPONENT = 1;
const TOTAL_STEPS_EXPONENT = 0.714434;
const STARTUP_SECONDS = 10;

export const calcMagoV5_1_0RenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(
    renderSettings.max_size,
    DEFAULT_MAX_SIZE
  );
  const totalSteps = toPositiveSettingNumber(
    renderSettings.total_steps,
    DEFAULT_TOTAL_STEPS
  );

  const perFrameWork =
    SCALE_COEFFICIENT *
    Math.pow(maxSize / NORMALIZED_SIZE, SIZE_EXPONENT) *
    Math.pow(frameCount, FRAME_COUNT_EXPONENT) *
    Math.pow(totalSteps, TOTAL_STEPS_EXPONENT);

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
    VideoEngine.V5_1_0,
    calcMagoV5_1_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const v5_1_0InpaintingRenderModel: VideoModelDefinition = {
  name: VideoEngine.V5_1_0,
  capabilities: {},
  displayName: "Mago Inpaint",
  description: "Inpainting with mask support",
  type: "render",
  status: "active",
  category: ModelCategory.TRANSFORMATION_VFX,
  isSourceImageRequired: true,
  isWanModel: true,
  extraKeys: {
    warm_up_size: 4,
    warm_up_type: "ping_pong",
    max_size: 1280
  },
  calcEstimatedRenderTime,
  formatValuesForBackend: (
    settings: VideoSettings,
    context: PrepareRenderSettingsContext
  ) => {
    const totalSteps = (settings.total_steps as number) ?? 6;
    const splitStepPercentage =
      (settings.split_step_percentage as number) ?? 40;
    const splitStep = Math.round(totalSteps * (1 - splitStepPercentage / 100));

    const formatted: VideoSettings = {
      ...settings,
      total_steps: totalSteps,
      steps: totalSteps,
      split_step_percentage: splitStepPercentage,
      split_step: splitStep,
      width: context.inputVideoWidth,
      height: context.inputVideoHeight
    };

    if (
      typeof formatted.input_mask === "string" &&
      formatted.input_mask.length > 0
    ) {
      delete formatted.mask_prompt;
    }

    return formatted;
  },
  renderDurationLimits: {
    defaultFrameRange: { defaultRender: 99, testRender: 48 },
    modelLimits: {
      minFrames: 8,
      maxFrames: 2000,
      interpolationMinFrames: 24,
      interpolationMaxFrames: 2000
    }
  } satisfies RenderDurationLimits,
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
              label: "Frame & mask",
              ui: "ModifyFrameInput",
              specificConfig: {
                sourceRoles: ["reference_frame"],
                isPrimarySourceSlot: true
              },
              defaultValue: undefined,
              nullable: true
            }
          ]
        },
        {
          name: undefined,
          hidingCondition: hasNoReferenceFrame,
          settings: [
            {
              key: "prompt",
              type: "string",
              label: "Editing prompt",
              ui: "Prompt",
              defaultValue: "",
              nullable: true,
              specificConfig: {
                placeholder: "inpainting.basic.prompt.placeholder"
              }
            }
          ]
        },
        {
          name: undefined,
          hidingCondition: hasNoReferenceFrame,
          settings: [
            {
              key: "mask_prompt",
              type: "string",
              label: "Mask prompt (area to be changed)",
              ui: "MaskPromptInput",
              defaultValue: "person",
              nullable: true,
              hidingCondition: (settings) => Boolean(settings.input_mask)
            },
            {
              key: "input_mask",
              type: "string",
              label: "Mask",
              ui: "AppliedMaskTile",
              defaultValue: "",
              nullable: true,
              hidingCondition: (settings) => !settings.input_mask
            }
          ]
        },
        {
          name: "titles.mask_settings.label",
          isNamedCollapsible: true,
          hidingCondition: hasNoReferenceFrame,
          settings: [
            {
              key: "invert_mask",
              type: "boolean",
              label: "Invert",
              tooltip:
                "When enabled, the mask is inverted so the masked area becomes unmasked and vice versa.",
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "grow_mask_expand",
              type: "number",
              label: "Expand by",
              tooltip:
                "Expands the mask boundary outward by the specified number of pixels. Increase if the mask is cutting off edges of the detected object.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 50,
              step: 1,
              defaultValue: 0,
              specificConfig: { unit: "px" }
            },
            {
              key: "mask_blur",
              type: "number",
              label: "Blur edges",
              tooltip:
                "Softens the mask edges by applying a blur. Higher values create smoother, more feathered edges.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 50,
              step: 1,
              defaultValue: 0,
              specificConfig: { unit: "px" }
            }
          ]
        }
      ]
    },
    {
      name: "Quality settings",
      level: "quality",
      hidingCondition: hasNoReferenceFrame,
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "total_steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Total diffusion steps: more steps result in sharper and more detailed results but slower processing.",
              ui: "SliderAndNumberInput",
              min: 4,
              max: 20,
              step: 1,
              defaultValue: 6
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
              key: "enable_interpolation",
              type: "boolean",
              label: "Interpolation",
              tooltip:
                "The interpolation mode renders only one every two frames and use interpolation to fill in the gaps. As a result, the render is quicker, costs less credits and might be less flickery. The output might be less detailed in occasions.",
              ui: "CheckboxInput",
              defaultValue: true
            }
          ]
        }
      ]
    },
    {
      name: "Advanced settings",
      level: "advanced",
      hidingCondition: hasNoReferenceFrame,
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "v5_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts",
              ui: "SliderAndNumberInput",
              min: 80,
              max: 100,
              step: 1,
              defaultValue: 80
            },
            {
              key: "v5_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
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
                "When enabled, a new reference image is generated between render parts, which allows for better transitions for high movement videos. For static/slow movement videos, disabling it ensure better consistency",
              ui: "CheckboxInput",
              defaultValue: true
            }
          ]
        },
        {
          name: undefined,
          hasSeparatorAbove: true,
          settings: [
            {
              key: "cfg",
              type: "number",
              label: "Prompt strength",
              tooltip:
                "The CFG is the prompt strength. Higher values will enforce more strongly the prompt instructions. A value too high might result in visual artefacts",
              ui: "SliderAndNumberInput",
              min: 0.5,
              max: 6,
              step: 0.1,
              defaultValue: 1
            },
            {
              key: "color_match_strength",
              type: "number",
              label: "Color consistency",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.1,
              defaultValue: 0
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
              key: "image_sequence_export",
              type: "enum",
              label: "Images format",
              tooltip:
                "Choose the format for the image sequence export. EXR formats provide higher quality for professional compositing workflows.",
              ui: "SelectInput",
              options: [
                { value: IMAGE_SEQUENCE_EXPORT.PNG, label: "PNG" },
                { value: IMAGE_SEQUENCE_EXPORT.EXR_16BIT, label: "EXR 16-bit" }
              ],
              defaultValue: IMAGE_SEQUENCE_EXPORT.PNG
            },
            {
              key: "lora_strength",
              type: "number",
              label: "Lora strength",
              ui: "hidden",
              defaultValue: 1
            }
          ]
        }
      ]
    }
  ]
} as const;
