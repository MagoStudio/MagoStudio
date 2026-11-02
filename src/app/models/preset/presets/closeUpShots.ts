import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const closeUpShotsPreset: MagoPreset = {
  id: "close-up-shots",
  displayName: "Close-up shots",
  description:
    "Change a face appearance while keeping the expressions and lip-sync",
  model: VideoEngine.V4_0_0,
  beforeImagePath: "/presets/closeup-before.png",
  afterImagePath: "/presets/closeup-after.png",
  settingsOverrides: {
    keep_background: false
  }
};
