import {
  CalcEstimatedRenderTimeFunction,
  IMAGE_SEQUENCE_EXPORT,
  ModelCategory,
  VideoEngine,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { toPositiveSettingNumber } from "@models/video/utils/toPositiveSettingNumber";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

const PIXELS_PER_MEGAPIXEL = 1024 * 1024;
const DEFAULT_FRAME_COUNT = 8;
const DEFAULT_UPSCALE_SCALE_FACTOR = 2;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const STARTUP_SECONDS = 80;
const SCALE_COEFFICIENT = 1.1284;
const SCALE_FACTOR_EXPONENT = 2;

export const calcMagoV2_0_0EsrganRenderTimeSeconds = (
  renderSettings: VideoSettings,
  frameRangeLength: number
): number => {
  const frameCount = toPositiveSettingNumber(
    frameRangeLength,
    DEFAULT_FRAME_COUNT
  );
  const width = toPositiveSettingNumber(renderSettings.width, DEFAULT_WIDTH);
  const height = toPositiveSettingNumber(renderSettings.height, DEFAULT_HEIGHT);
  const upscaleScaleFactor = toPositiveSettingNumber(
    renderSettings.upscale_scale_factor,
    DEFAULT_UPSCALE_SCALE_FACTOR
  );

  return (
    STARTUP_SECONDS +
    SCALE_COEFFICIENT *
      frameCount *
      Math.pow(upscaleScaleFactor, SCALE_FACTOR_EXPONENT) *
      ((width * height) / PIXELS_PER_MEGAPIXEL)
  );
};

const calcEstimatedRenderTime: CalcEstimatedRenderTimeFunction = (
  renderSettings,
  frameRangeLength
) => ({
  impactToShow: calcMagoNativeRenderCredits(
    VideoEngine.v2_0_0_esrgan_upscaler,
    calcMagoV2_0_0EsrganRenderTimeSeconds(renderSettings, frameRangeLength)
  )
});

const toScalarText = (value: VideoSettings[string]): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const formatValuesForBackend = (
  settings: VideoSettings,
  context: PrepareRenderSettingsContext
): VideoSettings => ({
  ...settings,
  max_size: 1,
  steps: 1,
  upscale_chunk_size: 120,
  upscale_scale_factor: parseInt(
    toScalarText(settings.upscale_scale_factor),
    10
  ),
  width: context.inputVideoWidth,
  height: context.inputVideoHeight
});

export const magoV2_0_0EsrganUpscalerRenderModel: VideoModelDefinition = {
  name: VideoEngine.v2_0_0_esrgan_upscaler,
  capabilities: {},
  displayName: "Upscaler",
  description: "Simple upscaling without creative alterations",
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
  isWanModel: false,
  settingsGroups: [
    {
      name: "Basic",
      level: "main",
      sections: [
        {
          name: undefined,
          settings: [
            {
              key: "upscale_scale_factor",
              type: "enum",
              label: "Upscale factor",
              tooltip:
                "Choose the upscaling factor. x2 doubles the resolution, x4 quadruples it.",
              ui: "SelectInput",
              options: [
                { value: "2", label: "x2" },
                { value: "4", label: "x4" }
              ],
              defaultValue: "2"
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
            }
          ]
        }
      ]
    }
  ],
  formatValuesForBackend,
  formatValuesForFrontend: (values) => ({
    ...values,
    upscale_scale_factor: toScalarText(values.upscale_scale_factor) || "2"
  })
};
