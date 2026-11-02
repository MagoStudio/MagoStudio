import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const replaceCharacterScenePreset: MagoPreset = {
  id: "replace-character-scene",
  displayName: "Replace character and scene",
  description:
    "Change the background and the character while keeping the motion",
  model: VideoEngine.V4_0_0,
  beforeImagePath: "/presets/replace-character-scene-before.png",
  afterImagePath: "/presets/replace-character-scene-after.png",
  settingsOverrides: {
    keep_background: true
  }
};
