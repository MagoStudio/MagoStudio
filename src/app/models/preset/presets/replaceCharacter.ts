import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const replaceCharacterPreset: MagoPreset = {
  id: "replace-character",
  displayName: "Replace with your character",
  description:
    "Replace a single character with someone else while keeping the background",
  model: VideoEngine.V4_0_0,
  beforeImagePath: "/presets/replace-character-before.png",
  afterImagePath: "/presets/replace-character-after.png",
  settingsOverrides: {
    keep_background: false
  }
};
