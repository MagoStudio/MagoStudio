import { parseMaskPoints } from "@domains/sam/utils/parseMaskPoints";
import {
  CalcEstimatedRenderTimeFunction,
  ModelCategory,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

const PIXELS_PER_MEGAPIXEL = 1024 * 1024;
const DEFAULT_FRAME_COUNT = 48;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_MANY_OBJECTS = 5;
const STARTUP_SECONDS = 20;
const FRAME_COEFFICIENT = 0.597294;
const SIZE_EXPONENT = 0.720236;
const OBJECT_COEFFICIENT = 0;

export const calcMagoV1_0_0MaskRenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const width = toPositiveSettingNumber(renderSettings.width, DEFAULT_WIDTH);
  const height = toPositiveSettingNumber(renderSettings.height, DEFAULT_HEIGHT);
  const detectedObjectCount = toPositiveSettingNumber(
    renderSettings.max_detected_objects,
    DEFAULT_MANY_OBJECTS
  );
  const objectFactor =
    1 + OBJECT_COEFFICIENT * Math.max(detectedObjectCount - 1, 0);

  return (
    STARTUP_SECONDS +
    FRAME_COEFFICIENT *
      frameCount *
      Math.pow((width * height) / PIXELS_PER_MEGAPIXEL, SIZE_EXPONENT) *
      objectFactor
  );
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => ({
  impactToShow: calcMagoNativeRenderCredits(
    VideoEngine.v1_0_0_mask,
    calcMagoV1_0_0MaskRenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

const formatValuesForFrontend = (values: VideoSettings): VideoSettings => {
  const {
    prompt_type,
    positive_points,
    negative_points,
    width,
    height,
    frame_idx,
    ...rest
  } = values;

  const hasPoints = prompt_type === "point" || prompt_type === "text+point";

  if (hasPoints) {
    const w = Number(width) || 1;
    const h = Number(height) || 1;

    const toNormalized = (p: { x: number; y: number }, label: 0 | 1) => ({
      x: p.x / w,
      y: p.y / h,
      label
    });

    const posPoints = positive_points as Array<{ x: number; y: number }>;
    const negPoints = negative_points as Array<{ x: number; y: number }>;

    const points = [
      ...(Array.isArray(posPoints)
        ? posPoints.map((p) => toNormalized(p, 1))
        : []),
      ...(Array.isArray(negPoints)
        ? negPoints.map((p) => toNormalized(p, 0))
        : [])
    ];

    return {
      ...rest,
      mask_mode:
        prompt_type === "text+point"
          ? "prompt_and_visual_selection"
          : "visual_selection",
      mask_visual_selection: JSON.stringify(points),
      ...(frame_idx !== undefined && { mask_frame_idx: frame_idx })
    };
  }

  return {
    ...rest,
    mask_mode: "prompt"
  };
};

export const v1_0_0_maskRenderModel: VideoModelDefinition = {
  name: VideoEngine.v1_0_0_mask,
  capabilities: {},
  displayName: "Masking",
  description: "Create a mask",
  type: "render",
  status: "hidden",
  category: ModelCategory.PRIVATE,
  isSourceImageRequired: false,
  calcEstimatedRenderTime,
  formatValuesForFrontend,
  formatValuesForBackend: (
    settings: VideoSettings,
    context: PrepareRenderSettingsContext
  ) => {
    const prepared: VideoSettings = {
      ...settings,
      width: context.inputVideoWidth,
      height: context.inputVideoHeight
    };

    const mode = prepared.mask_mode;
    const usesPoints =
      mode === "visual_selection" || mode === "prompt_and_visual_selection";

    if (usesPoints) {
      const visualSelection =
        prepared.mask_visual_selection ?? prepared.mask_points;
      const points = parseMaskPoints(
        typeof visualSelection === "string" ? visualSelection : undefined
      );

      const inputW = context.inputVideoWidth ?? 1;
      const inputH = context.inputVideoHeight ?? 1;
      const toPixel = (p: { x: number; y: number }) => ({
        x: p.x * inputW,
        y: p.y * inputH
      });

      prepared.positive_points = points
        .filter((p) => p.label === 1)
        .map(toPixel);
      prepared.negative_points = points
        .filter((p) => p.label === 0)
        .map(toPixel);
      prepared.frame_idx = (prepared.mask_frame_idx as number) ?? 0;

      if (mode === "prompt_and_visual_selection") {
        prepared.prompt_type = "text+point";
      } else {
        prepared.prompt_type = "point";
        delete prepared.prompt;
      }
    } else {
      prepared.prompt_type = "text";
    }

    delete prepared.mask_points;
    delete prepared.mask_visual_selection;
    delete prepared.mask_mode;
    delete prepared.mask_frame_idx;
    return prepared;
  },
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
              key: "mask_mode",
              type: "string",
              label: "Input type",
              ui: "MaskModeSelector",
              defaultValue: "prompt"
            },
            {
              key: "mask_visual_selection",
              type: "tool",
              label: "Segment frame to select visually",
              tooltip:
                "Click on the frame to place points that define the mask area. The AI model will segment the object under your points.",
              ui: "VisualMaskSelection",
              hidingCondition: (s) => s.mask_mode === "prompt",
              customValidation: (value, allValues) => {
                const mode = allValues.mask_mode;
                if (
                  mode !== "visual_selection" &&
                  mode !== "prompt_and_visual_selection"
                ) {
                  return null;
                }
                const isEmpty =
                  !value ||
                  value === "[]" ||
                  (typeof value === "string" && value.trim() === "");
                if (!isEmpty) return null;
                if (mode === "prompt_and_visual_selection") {
                  return "masking.generate_disabled_add_prompt_and_points.label";
                }
                return "masking.generate_disabled_add_points.label";
              }
            },
            {
              key: "mask_points",
              type: "string",
              label: "",
              ui: "hidden",
              nullable: true,
              defaultValue: ""
            },
            {
              key: "prompt",
              type: "string",
              label: "Write that you want to change",
              tooltip: `# How masking works

**The white area indicates the part that will be affected. Black area will be untouched.**

Describe the object you want to change. We'll create a mask so the rest pixels outside of mask remains untouched. Example with prompt 'Person', I want to edit people and leave background the same.

If you want to change the background but keep people unchanged, prompt the same 'Person' and then turn on Invert the mask checkbox. Check Inverted mask example on top.

Example: If you type 'person', all people in the video will be masked.

Example: 'blue cap on the right.' The model will try to mask that exact cap and leave the others untouched.

**Warning:** Do not try to select two or more different objects at once. You can select only one object or a group of the same objects. 'People and carpet' prompt probably won't work`,
              tooltipFormat: "markdown",
              tooltipImages: [
                {
                  src: "/images/masking-tooltip-original.png",
                  caption: "Original"
                },
                {
                  src: "/images/masking-tooltip-prompt-person.png",
                  caption: "Prompt: Person"
                },
                {
                  src: "/images/masking-tooltip-inverted-mask.png",
                  caption: "Inverted mask"
                }
              ],
              ui: "Prompt",
              defaultValue: "",
              nullable: true,
              specificConfig: {
                hideAutoPrompt: true,
                placeholder: "masking.mask_mode_prompt.placeholder"
              },
              hidingCondition: (s) => s.mask_mode === "visual_selection",
              customValidation: (value, allValues) => {
                const mode = allValues.mask_mode;
                if (mode === "visual_selection") return null;
                const isEmpty =
                  !value || (typeof value === "string" && value.trim() === "");
                if (!isEmpty) return null;
                if (mode === "prompt_and_visual_selection") {
                  return "masking.generate_disabled_add_prompt_and_points.label";
                }
                return "masking.generate_disabled_add_prompt.label";
              }
            },
            {
              key: "mask_frame_idx",
              type: "number",
              label: "Frame index",
              ui: "hidden",
              nullable: true,
              defaultValue: 0,
              hidingCondition: (s) => s.mask_mode === "prompt"
            },
            {
              key: "invert_mask",
              type: "boolean",
              label: "Invert Mask",
              tooltip: `# Invert mask if you want to select background

The white area shows the part of the mask that will be changed, so if you need change background and leave people or object untouched, select object first and then invert`,
              tooltipFormat: "markdown",
              tooltipImages: [
                {
                  src: "/images/masking-tooltip-prompt-person.png",
                  caption: "Prompt: Person"
                },
                {
                  src: "/images/masking-tooltip-inverted-mask.png",
                  caption: "Inverted mask (background selected)"
                }
              ],
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "expand",
              type: "number",
              label: "Expand mask by",
              tooltip:
                "Expands the mask boundary outward by the specified number of pixels. Increase if the mask is cutting off edges of the detected object.",
              ui: "SliderAndNumberInputFullWidth",
              min: 0,
              max: 50,
              step: 1,
              defaultValue: 0,
              specificConfig: { unit: "px" }
            },
            {
              key: "blur",
              type: "number",
              label: "Blur mask edges",
              tooltip:
                "Softens the mask edges by applying a blur. Higher values create smoother, more feathered edges.",
              ui: "SliderAndNumberInputFullWidth",
              min: 0,
              max: 50,
              step: 1,
              defaultValue: 0,
              specificConfig: { unit: "px" }
            },
            {
              key: "max_detected_objects",
              type: "number",
              label: "",
              ui: "CheckboxOrNumberInput",
              min: 1,
              max: 20,
              step: 1,
              defaultValue: -1,
              specificConfig: { valueIfChecked: -1 },
              hidingCondition: () => true
            }
          ]
        }
      ]
    }
  ]
};
