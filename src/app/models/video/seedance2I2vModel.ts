import { getDurationFromFrameRange } from "@domains/renders/utils/getDurationFromFrameRange";
import {
  CalcEstimatedRenderTimeFunction,
  PrepareRenderSettingsContext,
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";

export const SEEDANCE_2_I2V_CREDITS_PER_SECOND_BY_RESOLUTION: Record<
  string,
  number
> = {
  "480p": 275,
  "720p": 617,
  "1080p": 1389,
  "4k": 3174
};
export const SEEDANCE_2_I2V_RESOLUTION_OPTIONS = [
  { value: "480p", label: "480p" },
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4k", label: "4K" }
];
const SEEDANCE_2_I2V_DEFAULT_RESOLUTION = "720p";
const SEEDANCE_2_I2V_DEFAULT_DURATION_SECONDS = 5;
const SEEDANCE_2_I2V_DEFAULT_FPS = 24;
const SEEDANCE_2_I2V_MIN_DURATION_SECONDS = 4;
const SEEDANCE_2_I2V_MAX_DURATION_SECONDS = 15;
const SEEDANCE_2_I2V_MIN_FPS = 1;
const SEEDANCE_2_I2V_MAX_FPS = 60;

export const calcSeedance2I2vEstimatedRenderTime = (
  creditsPerSecondByResolution: Record<string, number>,
  defaultResolution: string
): CalcEstimatedRenderTimeFunction => {
  return (renderSettings, frameRangeLength) => {
    const fps =
      typeof renderSettings.fps === "number"
        ? renderSettings.fps
        : SEEDANCE_2_I2V_DEFAULT_FPS;

    const resolution =
      typeof renderSettings.resolution === "string"
        ? renderSettings.resolution
        : defaultResolution;
    const creditsPerSecond =
      creditsPerSecondByResolution[resolution] ??
      creditsPerSecondByResolution[defaultResolution];

    const seconds = frameRangeLength / fps;
    return { impactToShow: Math.ceil(seconds * creditsPerSecond) };
  };
};

export const buildSeedance2I2vFormatValuesForBackend = (
  defaultResolution: string
) => {
  return (
    settings: VideoSettings,
    context: PrepareRenderSettingsContext
  ): VideoSettings => {
    const {
      image_id,
      end_image_id,
      resolution,
      generate_audio,
      durationInSeconds,
      ...rest
    } = settings;

    const trimmedEndImageId =
      typeof end_image_id === "string" && end_image_id.length > 0
        ? end_image_id
        : undefined;

    return {
      ...rest,
      image_id: image_id as string,
      end_image_id: trimmedEndImageId,
      resolution: (resolution as string) ?? defaultResolution,
      aspect_ratio: "auto",
      generate_audio:
        typeof generate_audio === "boolean" ? generate_audio : true,
      durationInSeconds:
        typeof durationInSeconds === "number"
          ? durationInSeconds
          : getDurationFromFrameRange(context.frameRange, context.fps),
      frameRangeSeconds: [
        context.frameRange[0] / context.fps,
        context.frameRange[1] / context.fps
      ],
      fps: context.fps
    };
  };
};

export const buildSeedance2I2vSettingsGroups = (
  creditsPerSecondByResolution: Record<string, number>,
  resolutionOptions: Array<{ value: string; label: string }>
) => [
  {
    name: "Basic",
    level: "main" as const,
    sections: [
      {
        name: undefined,
        settings: [
          {
            key: "image_id",
            type: "string" as const,
            label: "Start image",
            tooltip: "The image that the clip will animate from",
            ui: "SingleImageUploader" as const,
            defaultValue: undefined,
            nullable: false,
            errorMessage: "You need to add a start image"
          },
          {
            key: "end_image_id",
            type: "string" as const,
            label: "End image (optional)",
            tooltip: "The image that the clip will animate towards",
            ui: "SingleImageUploader" as const,
            defaultValue: undefined,
            nullable: true
          },
          {
            key: "prompt",
            type: "string" as const,
            label: "Prompt",
            tooltip: "Describe the motion and action you want to see",
            ui: "Prompt" as const,
            defaultValue: "",
            nullable: false,
            errorMessage: "You need to add a prompt"
          },
          {
            key: "durationInSeconds",
            type: "number" as const,
            label: "Duration (seconds)",
            tooltip: "Length of the generated clip, between 4 and 15 seconds",
            ui: "NumberInput" as const,
            min: SEEDANCE_2_I2V_MIN_DURATION_SECONDS,
            max: SEEDANCE_2_I2V_MAX_DURATION_SECONDS,
            step: 1,
            defaultValue: SEEDANCE_2_I2V_DEFAULT_DURATION_SECONDS,
            nullable: false,
            errorMessage: "Duration must be between 4 and 15 seconds"
          },
          {
            key: "fps",
            type: "number" as const,
            label: "FPS",
            tooltip: "Frame rate of the generated clip",
            ui: "NumberInput" as const,
            min: SEEDANCE_2_I2V_MIN_FPS,
            max: SEEDANCE_2_I2V_MAX_FPS,
            step: 1,
            defaultValue: SEEDANCE_2_I2V_DEFAULT_FPS,
            nullable: false,
            errorMessage: "FPS must be a positive number"
          },
          {
            key: "resolution",
            type: "enum" as const,
            label: "Resolution",
            tooltip:
              "Output video resolution. Higher resolutions cost more credits",
            ui: "SelectInput" as const,
            options: resolutionOptions.map((option) => ({
              ...option,
              badge: `${creditsPerSecondByResolution[option.value]}/s`
            })),
            defaultValue: SEEDANCE_2_I2V_DEFAULT_RESOLUTION,
            nullable: false
          },
          {
            key: "generate_audio",
            type: "boolean" as const,
            label: "Generate audio",
            tooltip: "Generate audio matching your scene",
            ui: "SwitchInput" as const,
            defaultValue: true,
            nullable: false
          }
        ]
      }
    ]
  }
];

export const seedance2I2vModel: VideoModelDefinition = {
  name: VideoEngine.seedance_2_i2v,
  capabilities: {},
  displayName: "Seedance 2.0 Image to Video",
  description: "Animate a still image into a video clip",
  type: "render",
  status: "hidden",
  modeAvailability: {
    isRelaxedModeAvailable: false
  },
  calcEstimatedRenderTime: calcSeedance2I2vEstimatedRenderTime(
    SEEDANCE_2_I2V_CREDITS_PER_SECOND_BY_RESOLUTION,
    SEEDANCE_2_I2V_DEFAULT_RESOLUTION
  ),
  renderDurationLimits: {
    defaultFrameRange: {
      defaultRenderSeconds: SEEDANCE_2_I2V_DEFAULT_DURATION_SECONDS,
      testRenderSeconds: SEEDANCE_2_I2V_MIN_DURATION_SECONDS
    },
    modelLimits: {
      minSeconds: SEEDANCE_2_I2V_MIN_DURATION_SECONDS,
      maxSeconds: SEEDANCE_2_I2V_MAX_DURATION_SECONDS
    }
  } satisfies RenderDurationLimits,
  settingsGroups: buildSeedance2I2vSettingsGroups(
    SEEDANCE_2_I2V_CREDITS_PER_SECOND_BY_RESOLUTION,
    SEEDANCE_2_I2V_RESOLUTION_OPTIONS
  ),
  formatValuesForBackend: buildSeedance2I2vFormatValuesForBackend(
    SEEDANCE_2_I2V_DEFAULT_RESOLUTION
  )
};
