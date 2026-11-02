import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const replaceMultipleCharactersPreset: MagoPreset = {
  id: "replace-multiple-characters",
  displayName: "Replace multiple characters",
  description: "Good for groups, keeps the background",
  model: VideoEngine.V3_4_0,
  beforeImagePath: "/presets/replace-multiple-before.png",
  afterImagePath: "/presets/replace-multiple-after.png",
  settingsOverrides: {
    control_type: "pose"
  }
};
