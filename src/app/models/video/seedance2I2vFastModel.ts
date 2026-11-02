import {
  RenderDurationLimits,
  VideoEngine,
  VideoModelDefinition
} from "@models/video/types";

import {
  buildSeedance2I2vFormatValuesForBackend,
  buildSeedance2I2vSettingsGroups,
  calcSeedance2I2vEstimatedRenderTime
} from "./seedance2I2vModel";

export const SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION: Record<
  string,
  number
> = {
  "480p": 220,
  "720p": 494
};
const SEEDANCE_2_I2V_FAST_DEFAULT_RESOLUTION = "720p";
const SEEDANCE_2_I2V_FAST_DEFAULT_DURATION_SECONDS = 5;
const SEEDANCE_2_I2V_FAST_MIN_DURATION_SECONDS = 4;
const SEEDANCE_2_I2V_FAST_MAX_DURATION_SECONDS = 15;

export const seedance2I2vFastModel: VideoModelDefinition = {
  name: VideoEngine.seedance_2_i2v_fast,
  capabilities: {},
  displayName: "Seedance 2.0 Image to Video Fast",
  description: "Animate a still image into a video clip, faster and cheaper",
  type: "render",
  status: "hidden",
  modeAvailability: {
    isRelaxedModeAvailable: false
  },
  calcEstimatedRenderTime: calcSeedance2I2vEstimatedRenderTime(
    SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION,
    SEEDANCE_2_I2V_FAST_DEFAULT_RESOLUTION
  ),
  renderDurationLimits: {
    defaultFrameRange: {
      defaultRenderSeconds: SEEDANCE_2_I2V_FAST_DEFAULT_DURATION_SECONDS,
      testRenderSeconds: SEEDANCE_2_I2V_FAST_MIN_DURATION_SECONDS
    },
    modelLimits: {
      minSeconds: SEEDANCE_2_I2V_FAST_MIN_DURATION_SECONDS,
      maxSeconds: SEEDANCE_2_I2V_FAST_MAX_DURATION_SECONDS
    }
  } satisfies RenderDurationLimits,
  settingsGroups: buildSeedance2I2vSettingsGroups(
    SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION,
    [
      { value: "480p", label: "480p" },
      { value: "720p", label: "720p" }
    ]
  ),
  formatValuesForBackend: buildSeedance2I2vFormatValuesForBackend(
    SEEDANCE_2_I2V_FAST_DEFAULT_RESOLUTION
  )
};
