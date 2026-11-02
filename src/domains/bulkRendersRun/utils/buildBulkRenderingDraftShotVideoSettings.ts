import { VideoSettings } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";

export const buildBulkRenderingDraftShotVideoSettings = ({
  masterSettings,
  shotVideoSettingsPatch
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  shotVideoSettingsPatch: Partial<VideoSettings>;
}): VideoSettings => ({
  ...masterSettings.videoSettings,
  ...shotVideoSettingsPatch
});
