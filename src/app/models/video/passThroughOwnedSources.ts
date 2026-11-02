import { SourceImage } from "@domains/renders/types";

import { PrepareRenderSettingsContext, VideoSettings } from "./types";

export const passThroughOwnedSources = (
  _settings: VideoSettings,
  context: PrepareRenderSettingsContext
): SourceImage[] => context.sources;
