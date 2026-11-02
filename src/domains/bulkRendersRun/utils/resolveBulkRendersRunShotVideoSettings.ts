import { VideoEngine, VideoSettings } from "@models/video/types";
import {
  BulkRendersRunDetailShotOverride,
  BulkRendersRunDetailVideoSettings
} from "@schemas/bulkRendersRun";

export interface BulkRendersRunShotVideoSettings {
  prompt: string | undefined;
  engine: VideoEngine | undefined;
  values: VideoSettings;
  isOverridden: boolean;
}

const NON_OVERRIDE_VIDEO_SETTINGS_KEYS = new Set(["prompt", "frame_range"]);

export const resolveBulkRendersRunShotVideoSettings = ({
  shotId,
  runVideoSettings,
  shotOverridesById
}: {
  shotId: string;
  runVideoSettings: BulkRendersRunDetailVideoSettings | null | undefined;
  shotOverridesById:
    | Record<string, BulkRendersRunDetailShotOverride>
    | null
    | undefined;
}): BulkRendersRunShotVideoSettings => {
  const shotVideoSettings = shotOverridesById?.[shotId]?.video_settings;
  const isOverridden = Object.keys(shotVideoSettings ?? {}).some(
    (key) => !NON_OVERRIDE_VIDEO_SETTINGS_KEYS.has(key)
  );

  return {
    prompt: shotVideoSettings?.prompt ?? runVideoSettings?.prompt,
    engine: (shotVideoSettings?.engine ?? runVideoSettings?.engine) as
      | VideoEngine
      | undefined,
    values: { ...runVideoSettings, ...shotVideoSettings } as VideoSettings,
    isOverridden
  };
};
