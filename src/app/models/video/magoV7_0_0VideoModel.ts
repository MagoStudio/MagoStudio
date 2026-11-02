import {
  CalcEstimatedRenderTimeFunction,
  IMAGE_SEQUENCE_EXPORT,
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

export const calcMagoV7_0_0RenderTimeSeconds = (
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
    VideoEngine.V7_0_0,
    calcMagoV7_0_0RenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

const formatValuesForBackend = (settings: VideoSettings): VideoSettings => ({
  ...settings,
  image_sequence_export: IMAGE_SEQUENCE_EXPORT.EXR_16BIT
});

export const magoV7_0_0RenderModel: VideoModelDefinition = {
  name: VideoEngine.V7_0_0,
  capabilities: {},
  displayName: "Mago SDR-to-HDR",
  description: "HDR video enhancement",
  type: "render",
  status: "active",
  category: ModelCategory.UPSCALE,
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
              key: "v7_chunk_size",
              type: "number",
              label: "Context size",
              tooltip:
                "When doing long renders, the render is split in smaller parts and attached together. The Context size is the number of frames of those parts",
              ui: "SliderAndNumberInput",
              min: 24,
              max: 81,
              step: 1,
              defaultValue: 49
            },
            {
              key: "v7_chunk_overlap",
              type: "number",
              label: "Context overlap",
              tooltip:
                "Number of frames where a render part overlaps with the next one. Small values work best for high movement while higher value is better for more static/slow movement",
              ui: "SliderAndNumberInput",
              min: 0,
              max: 24,
              step: 1,
              defaultValue: 10
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend
};
