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
const PIXELS_PER_MEGAPIXEL = 1024 * 1024;
const DEFAULT_FRAME_COUNT = 8;
const DEFAULT_STEPS = 6;
const DEFAULT_DENOISE = 0.4;
const DEFAULT_TILE_WIDTH_COUNT = 3;
const DEFAULT_TILE_HEIGHT_COUNT = 2;
const BASELINE_STEPS = 10;
const BASELINE_DENOISE = 0.2;
const STEPS_EXPONENT = 1;
const DENOISE_EXPONENT = 0;
const TILE_COUNT_OFFSET = 0.324;
const TILE_COUNT_COEFFICIENT = 0.381;
const TILE_COUNT_EXPONENT = 4.946;
const TILE_SIZE_OFFSET = 0.000006;
const TILE_SIZE_COEFFICIENT = 1.003;
const TILE_SIZE_EXPONENT = 5;
const FRAME_COUNT_COEFFICIENT = 0.0129351;
const FRAME_COUNT_EXPONENT = 1.16848;
const STARTUP_SECONDS = 350;

export const calcMagoV1_0_0UpscalerRenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const maxSize = toPositiveSettingNumber(renderSettings.max_size);
  const steps = toPositiveSettingNumber(renderSettings.steps, DEFAULT_STEPS);
  const denoise = toPositiveSettingNumber(
    renderSettings.denoise,
    DEFAULT_DENOISE
  );
  const tileWidthCount = toPositiveSettingNumber(
    renderSettings.tile_width_count,
    DEFAULT_TILE_WIDTH_COUNT
  );
  const tileHeightCount = toPositiveSettingNumber(
    renderSettings.tile_height_count,
    DEFAULT_TILE_HEIGHT_COUNT
  );

  const tileCount = Math.ceil(tileWidthCount * tileHeightCount);
  const tileSizeMegapixels =
    (maxSize * maxSize) / PIXELS_PER_MEGAPIXEL / tileCount;
  const stepsRatio =
    Math.pow(steps / BASELINE_STEPS, STEPS_EXPONENT) *
    Math.pow(denoise / BASELINE_DENOISE, DENOISE_EXPONENT);

  const perFrameWork =
    (TILE_COUNT_OFFSET +
      TILE_COUNT_COEFFICIENT * Math.pow(tileCount, TILE_COUNT_EXPONENT)) *
    (TILE_SIZE_OFFSET +
      TILE_SIZE_COEFFICIENT *
        Math.pow(tileSizeMegapixels, TILE_SIZE_EXPONENT)) *
    (FRAME_COUNT_COEFFICIENT * Math.pow(frameCount, FRAME_COUNT_EXPONENT)) *
    stepsRatio;

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
    VideoEngine.v1_0_0_upscaler,
    calcMagoV1_0_0UpscalerRenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

export const magoV1_0_0upscalerRenderModel: VideoModelDefinition = {
  name: VideoEngine.v1_0_0_upscaler,
  capabilities: {},
  displayName: "Creative upscaler",
  description: "Retrieve detail and upscale",
  type: "render",
  status: "active",
  category: ModelCategory.UPSCALE,
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
  isSourceImageRequired: false,
  isWanModel: true,
  settingsGroups: [
    {
      name: "Main",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "prompt",
              type: "string",
              label: "Prompt",
              tooltip: "Write the prompt here",
              ui: "Prompt",
              defaultValue:
                "4K details, crisp textures, clean, temporal consistency, fine surface detail, high microcontrast, accurate tone mapping, sharp but natural",
              nullable: true
            }
          ]
        },
        {
          name: undefined,
          settings: [
            {
              key: "max_size",
              type: "number",
              label: "Output size",
              tooltip:
                "Size of the longest side of your output. Aspect ratio from original video is always respected.",
              ui: "NumberInputWithLabelInside",
              min: 1280,
              max: 1920,
              step: 1,
              defaultValue: 1920
            }
          ]
        },
        {
          name: undefined,
          settingsPerRow: 2,
          settings: [
            {
              key: "steps",
              type: "number",
              label: "Steps",
              tooltip:
                "Total diffusion steps: more steps result in sharper and more detailed results but slower processing. Lower steps can help achieving less refined styles.",
              ui: "SliderAndNumberInputFullWidth",
              min: 3,
              max: 10,
              step: 1,
              defaultValue: 6
            },
            {
              key: "denoise",
              type: "number",
              label: "Detail enhancement",
              ui: "SliderAndNumberInputFullWidth",
              tooltip:
                "Higher values will give AI more freedom to invent elements from the original input. It's good to retrieve quality and/or correct artefacts but could lead to other artefacts in some cases.\nKeep this value low if your input video is well detailed already.",
              min: 0.1,
              max: 0.9,
              step: 0.1,
              defaultValue: 0.4
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
              key: "enable_interpolation",
              type: "boolean",
              label: "Interpolation",
              tooltip:
                "The interpolation mode renders only one every two frames and use interpolation to fill in the gaps. As a result, the render is quicker and costs less credits. The output might be less detailed in occasions.",
              ui: "CheckboxInput",
              defaultValue: false
            },
            {
              key: "upscale_chunk_size",
              type: "number",
              label: "Context size",
              ui: "SliderAndNumberInput",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts.",
              min: 9,
              max: 101,
              step: 4,
              defaultValue: 77
            },
            {
              key: "upscale_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames that overlap between consecutive context windows. Higher values provide better continuity but slower processing.",
              ui: "SliderAndNumberInput",
              min: 1,
              max: 10,
              step: 1,
              defaultValue: 10
            },
            {
              key: "tile_width_count",
              type: "number",
              label: "Tile width count",
              ui: "SliderAndNumberInput",
              tooltip:
                "A higher count will allow for more detailed upscaling, but might create artefacts. A lower count will maintain overall consistency.",
              min: 1,
              max: 4,
              step: 1,
              defaultValue: 2
            },
            {
              key: "tile_height_count",
              type: "number",
              label: "Tile height count",
              ui: "SliderAndNumberInput",
              tooltip:
                "A higher count will allow for more detailed upscaling, but might create artefacts. A lower count will maintain overall consistency.",
              min: 1,
              max: 4,
              step: 1,
              defaultValue: 2
            },
            {
              key: "negative_prompt",
              type: "string",
              label: "Negative Prompt",
              tooltip:
                "Describe what you do not want to see in the output. It can be specific elements that appear in your results and that you wish to remove, or general concepts related to quality (low resolution, bad anatomy).",
              ui: "Prompt",
              defaultValue:
                "static, blurred details, subtitles, worst quality, JPEG compression residue, bad quality, low quality, naked, nude, racy, nsfw",
              hidingCondition: () => true
            }
          ]
        }
      ]
    }
  ]
} as const;
