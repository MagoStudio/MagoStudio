import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const seedancePreset: MagoPreset = {
  id: "seedance-2",
  displayName: "Seedance 2.0",
  description: "Transform your video with multiple references",
  model: VideoEngine.seedance_2,
  beforeImagePath: "/presets/seedance-before.png",
  afterImagePath: "/presets/seedance-after.png",
  settingsOverrides: {}
};
