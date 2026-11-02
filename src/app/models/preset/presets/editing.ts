import { VideoEngine } from "@models/video/types";

import { MagoPreset } from "../types";

export const editingPreset: MagoPreset = {
  id: "editing",
  displayName: "Kling 3.0 Motion Control",
  description:
    "Perfect for character replacement with complex face expression and lip-syncing",
  model: VideoEngine.kling_3_motion_control,
  beforeImagePath: "/presets/editing-before.png",
  afterImagePath: "/presets/editing-after.png",
  settingsOverrides: {}
};
