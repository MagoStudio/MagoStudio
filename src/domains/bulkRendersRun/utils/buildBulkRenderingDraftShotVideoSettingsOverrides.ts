import { VideoModelDefinition, VideoSettings } from "@models/video/types";

import { filterVideoSettingsPatchToModel } from "./filterVideoSettingsPatchToModel";

export const buildBulkRenderingDraftShotVideoSettingsOverrides = ({
  videoSettingsByShotId,
  getShotCurrentVideoModelDefinition
}: {
  videoSettingsByShotId: Record<string, Partial<VideoSettings>>;
  getShotCurrentVideoModelDefinition: (shotId: string) => VideoModelDefinition;
}): Record<string, Partial<VideoSettings>> =>
  Object.fromEntries(
    Object.entries(videoSettingsByShotId)
      .map(
        ([shotId, videoSettingsPatch]) =>
          [
            shotId,
            filterVideoSettingsPatchToModel(
              videoSettingsPatch,
              getShotCurrentVideoModelDefinition(shotId)
            )
          ] as const
      )
      .filter(
        ([, videoSettingsPatch]) => Object.keys(videoSettingsPatch).length > 0
      )
  );
