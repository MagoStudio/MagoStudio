import { BulkRenderingDraftShotVideoSettingsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotVideoSettings";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";

import { buildBulkRenderingDraftShotVideoSettings } from "./buildBulkRenderingDraftShotVideoSettings";

export interface BulkRendersRunShotVideoCredits {
  credits: number;
  isFrameLengthResolved: boolean;
}

export const computeBulkRendersRunShotVideoCredits = ({
  shotId,
  masterSettings,
  draftShotVideoSettings,
  shotMaxFramesById,
  shotFpsById
}: {
  shotId: string;
  masterSettings: BulkRendersRunDraftMasterSettings;
  draftShotVideoSettings: BulkRenderingDraftShotVideoSettingsState;
  shotMaxFramesById: Map<string, number>;
  shotFpsById: Map<string, number>;
}): BulkRendersRunShotVideoCredits => {
  const shotFrameRangeLength = shotMaxFramesById.get(shotId);
  if (shotFrameRangeLength === undefined) {
    return { credits: 0, isFrameLengthResolved: false };
  }

  const shotVideoSettings = buildBulkRenderingDraftShotVideoSettings({
    masterSettings,
    shotVideoSettingsPatch:
      draftShotVideoSettings.shotVideoSettingsOverrideById[shotId] ?? {}
  });
  const shotFps = shotFpsById.get(shotId);
  const shotVideoSettingsWithFps =
    shotFps === undefined
      ? shotVideoSettings
      : { ...shotVideoSettings, fps: shotFps };

  return {
    credits: Math.ceil(
      masterSettings.videoModel.calcEstimatedRenderTime(
        shotVideoSettingsWithFps,
        shotFrameRangeLength,
        true
      ).impactToShow
    ),
    isFrameLengthResolved: true
  };
};
