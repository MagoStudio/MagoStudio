import { CREDITS_PER_SECOND } from "@config/constants";
import {
  CalcEstimatedRenderTimeFunction,
  VideoEngine,
  Magov2Diffs,
  RenderDurationLimits,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { roundUp } from "@utils/priceHelper";

const fastModeDiscount = 0.3;

const magov3BaselineSteps = 25;
const magov3MinSteps = 15;
const magov3BaselineRenderTime = (677 / magov3BaselineSteps) * magov3MinSteps;
const magov3BaselineMaxSize = 1024;
const magov3BaselineFrameCount = 105;

const calcFirstPassDiff = (
  row: VideoSettings,
  frameRangeLength: number
): Magov2Diffs => {
  try {
    const maxSize: number = row.max_size as number;

    let sizeDiff: number = 1;
    let cnDiff: number = 1;
    let ctxDiff: number = 1;

    let steps: number = row.steps as number;
    const frames: number = frameRangeLength !== null ? frameRangeLength : 8;

    sizeDiff = Math.pow(maxSize / magov3BaselineMaxSize, 4);
    steps = Math.max(steps, magov3MinSteps) / magov3MinSteps;
    ctxDiff = ((frames + 15) / (magov3BaselineFrameCount + 15)) ** 2;

    sizeDiff = Math.max(sizeDiff, 1);

    let denoise: number = Math.max((row.denoise as number) || 1, 1);
    const stepsDiff: number = steps;
    const denoiseDiff: number = denoise;

    const cnDiffFastMode: number = row.enable_interpolation
      ? 1 - fastModeDiscount
      : 1;

    ctxDiff = cnDiffFastMode * ctxDiff;

    return {
      total: sizeDiff * stepsDiff * cnDiff * ctxDiff * denoiseDiff,
      sizeDiff,
      stepsDiff,
      cnDiff,
      ctxDiff,
      denoiseDiff
    };
  } catch (error) {
    console.error(`Error with max_size: ${JSON.stringify(row.max_size)}`);
    return {
      total: 0,
      sizeDiff: 0,
      stepsDiff: 0,
      cnDiff: 0,
      ctxDiff: 0,
      denoiseDiff: 0
    };
  }
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => {
  const renderTimes = calcFirstPassDiff(renderSettings, frameRangeLength);

  const baseTime = magov3BaselineRenderTime;
  const coldStart = 0;

  const totalCredits = roundUp(
    (renderTimes["total"] * baseTime + coldStart) * CREDITS_PER_SECOND
  );

  let baseRenderTime = roundUp(
    renderTimes["ctxDiff"] * baseTime * CREDITS_PER_SECOND
  );

  const sizeDiffRenderTime = roundUp(baseRenderTime * renderTimes["sizeDiff"]);
  const sizeDiffImpact = sizeDiffRenderTime - baseRenderTime;

  const stepsDiffRenderTime = roundUp(
    sizeDiffRenderTime * renderTimes["stepsDiff"]
  );
  const stepsDiffImpact = stepsDiffRenderTime - sizeDiffRenderTime;

  const cnDiffRenderTime = roundUp(stepsDiffRenderTime * renderTimes["cnDiff"]);
  const cnDiffImpact = cnDiffRenderTime - stepsDiffRenderTime;

  const denoiseDiffRenderTime = roundUp(
    cnDiffRenderTime * renderTimes["denoiseDiff"]
  );
  const denoiseDiffImpact = denoiseDiffRenderTime - cnDiffRenderTime;

  const totalImpact =
    baseRenderTime +
    sizeDiffImpact +
    stepsDiffImpact +
    cnDiffImpact +
    denoiseDiffImpact;

  const totalImpactRounded = roundUp(totalImpact);
  const roundingDiff = totalCredits - totalImpactRounded;
  baseRenderTime = roundUp(baseRenderTime + roundingDiff + coldStart);
  const impactToShow = Math.ceil(totalImpact);

  return { impactToShow };
};

export const magoV3_1_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V3_1_0,
  capabilities: {},
  displayName: "FirstFrame V3.1 (legacy) ",
  description: "To be removed soon, don't use it in new projects!",
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
                "Use a style reference image to drive the stylization. Keep in mind that this includes all details in the image (colors, shapes, characters, objects); avoid images with artifacts and try to use a stylized frame of your video if possible.",
              ui: "FileUploaderWithStylizeButton",
              specificConfig: {
                sourceRoles: ["key_frame"],
                isPrimarySourceSlot: true
              },
              defaultValue: undefined,
              nullable: false
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
              max: 3000,
              step: 1,
              defaultValue: 1620
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
            },
            {
              key: "enable-unsampling",
              type: "boolean",
              label: "Unsampling",
              ui: "CheckboxInput",
              defaultValue: false
            }
          ]
        },
        {
          name: "Image influence",
          hidingCondition: (settings) => !settings.source_image_slot,
          settings: [
            {
              key: "image_weight",
              type: "number",
              label: "Image weight",
              tooltip:
                "Controls how strongly the reference image influences the final output. A higher weight means the generation will more closely match the reference image's style and characteristics, while a lower weight creates a more subtle influence and gives more importance to the prompt.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1.5,
              step: 0.01,
              defaultValue: 0.7
            },
            {
              key: "weight_type",
              type: "enum",
              label: "Style mode",
              ui: "SelectInput",
              options: [
                { value: "linear", label: "Balanced" },
                { value: "style transfer precise", label: "Precise" },
                { value: "strong style transfer", label: "Strong" }
              ],
              defaultValue: "style transfer precise"
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
              min: 1.1,
              max: 6,
              step: 0.1,
              defaultValue: 3
            }
          ]
        },
        {
          name: "LoRAs",
          settings: [
            {
              key: "style_lora",
              type: "enum",
              label: "Select a LoRA",
              ui: "SelectInput",
              options: [
                {
                  value: "not_selected",
                  label: "Not selected"
                },
                {
                  value: "_oil_painting",
                  label: "Oil Painting"
                },
                {
                  value: "_watercolor",
                  label: "Watercolor"
                },
                {
                  value: "_pastel",
                  label: "Pastel"
                },
                {
                  value: "_comic_book",
                  label: "Comic Book"
                },
                {
                  value: "_pencil",
                  label: "Pencil"
                }
              ],
              defaultValue: "not_selected"
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
              key: "denoise",
              type: "number",
              label: "Denoise",
              tooltip:
                "Denoise (or diffusion strength) indicates how different the output frame will be from the input frame. A value of 1 means the style is fully applied with no influence from the original image. A value of 0 means no style is applied and you retain the original image. It affects both image and prompt influence.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 1
            },
            {
              key: "enable_cache",
              type: "boolean",
              label: "Cache",
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
              key: "context_mode",
              type: "enum",
              label: "Stability",
              ui: "SelectInput",
              options: [
                { value: "low", label: "low" },
                { value: "medium", label: "medium" },
                { value: "high", label: "high" }
              ],
              defaultValue: "low"
            }
          ]
        },
        {
          name: "Context settings",
          settings: [
            {
              key: "chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "Size of the context window for the generation. Lower values generate faster and keep the style better but will lose context from the previous frames.",
              ui: "SliderAndNumberInput",
              min: 50,
              max: 200,
              step: 1,
              defaultValue: 200
            },
            {
              key: "chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Overlap between context windows. Helps reduce sharp transitions between frames.",
              ui: "SliderAndNumberInput",
              min: 4,
              max: 24,
              step: 1,
              defaultValue: 10
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
          name: "Depth",
          tooltip:
            "Depth detection in order to determine the distance to each pixel in the frame. Helps in breaking down the frame between background, foreground and specific elements.",
          settings: [
            {
              key: "cn_depth_strength",
              type: "number",
              label: "Depth Weight",
              tooltip:
                "Depth detection in order to determine the 3D volumes of the scene. Helps in breaking down the frame between background, foreground and specific elements. The weight determines how strong is the influence of the depth information.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.5
            },
            {
              key: "cn_depth_start",
              secondKey: "cn_depth_end",
              type: "number",
              label: "Active range",
              tooltip:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence.",
              ui: "RangeToStartEndInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0,
              secondDefaultValue: 1
            },
            {
              key: "cn_depth_resolution",
              type: "number",
              label: "Depth Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024
            }
          ]
        },
        {
          name: "Tile",
          tooltip:
            "Breaks down the frame in small tiles and checks if details within the tile are coherent and in line with the prompt. Helps in getting rid of bad details and refine good details.",
          settings: [
            {
              key: "cn_tile_strength",
              type: "number",
              label: "Tile Weight",
              tooltip:
                "Used for upscaling/deblurring. Helps the output to stay coherent with the input video and to preserve details and colors. The weight determines how strong is the influence of the added details.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.15
            },
            {
              key: "cn_tile_start",
              secondKey: "cn_tile_end",
              type: "number",
              label: "Active range",
              tooltip:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence.",
              ui: "RangeToStartEndInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0,
              secondDefaultValue: 1
            },
            {
              key: "cn_tile_resolution",
              type: "number",
              label: "Tile Resolution",
              tooltip:
                "Resolution used for controlnet maps. Higher resolutions include more details.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024
            }
          ]
        },
        {
          name: "Canny",
          tooltip:
            "A method to detect the edges in an image, turning it into a black—and—white outline. So you can redesign objects while keeping the same outline.",
          settings: [
            {
              key: "cn_canny_strength",
              type: "number",
              label: "Canny Weight",
              tooltip:
                "Edge detection (i.e. outlines) in order to preserve the shapes and general details of the input video. The weight determines how strong is the influence of the outlines information.",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.2
            },
            {
              key: "cn_canny_start",
              secondKey: "cn_canny_end",
              type: "number",
              label: "Active range",
              tooltip:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence.",
              ui: "RangeToStartEndInput",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0,
              secondDefaultValue: 1
            },
            {
              key: "cn_canny_resolution",
              type: "number",
              label: "Canny Resolution",
              tooltip: "Resolution used for canny controlnet maps.",
              ui: "NumberInput",
              min: 512,
              max: 3000,
              step: 1,
              defaultValue: 1024
            }
          ]
        }
      ]
    }
  ]
} as const;
