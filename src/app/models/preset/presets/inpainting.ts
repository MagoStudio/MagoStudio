import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const inpaintingPreset: MagoPreset = {
  id: "inpainting",
  displayName: "Mago Inpaint",
  description: "Edit a specific part of your render",
  model: VideoEngine.V5_1_0,
  settingsOverrides: {},
  beforeImagePath: "/presets/inpainting-before.png",
  afterImagePath: "/presets/inpainting-after.png"
};
