import { VideoEngine, VideoSettings } from "@models/video/types";

type PresetBase = {
  id: string;
  displayName: string;
  description: string;
  model: VideoEngine;
  settingsOverrides: Partial<VideoSettings>;
};

export type MagoPreset = PresetBase & {
  beforeImagePath: string;
  afterImagePath: string;
};
