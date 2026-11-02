import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const styleTransferPreset: MagoPreset = {
  id: "style-transfer",
  displayName: "Style Transfer",
  description:
    "Change the style of your scene while respecting the lip-sync and the facial expression. Perfect for AI rendering",
  model: VideoEngine.V5_0_0,
  settingsOverrides: {},
  beforeImagePath: "/presets/style-transfer-before.png",
  afterImagePath: "/presets/style-transfer-after.png"
};
