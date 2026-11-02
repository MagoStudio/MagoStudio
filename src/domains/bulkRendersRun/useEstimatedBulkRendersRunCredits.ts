import { BulkRenderingDraftShotVideoSettingsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotVideoSettings";
import { getAdapter } from "@home/components/Navbar/Img2ImgModalV2/adapters";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { VIDEO_ONLY_ENGINES, VideoEngine } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";

import { computeBulkRendersRunShotVideoCredits } from "./utils/computeBulkRendersRunShotVideoCredits";
import { estimateBulkRendersRunCredits } from "./utils/estimateBulkRendersRunCredits";

export interface EstimatedBulkRendersRunCredits {
  estimatedRunCredits: number;
  isVideoCostPerShotResolved: boolean;
}

const computeImageCreditsForShot = (
  imageSettings: Img2ImgType,
  selectedVideoEngine: VideoEngine
): number => {
  if (VIDEO_ONLY_ENGINES.has(selectedVideoEngine)) return 0;

  return Math.ceil(getAdapter(imageSettings).computeCost(imageSettings));
};

export const useEstimatedBulkRendersRunCredits = ({
  selectedShotIds,
  imageSettingsByShotId,
  masterSettings,
  draftShotVideoSettings,
  shotMaxFramesById,
  shotFpsById,
  isTeamMember,
  shotIdsWithUploadedFirstFrame
}: {
  selectedShotIds: string[];
  imageSettingsByShotId: Record<string, Img2ImgType>;
  masterSettings: BulkRendersRunDraftMasterSettings;
  draftShotVideoSettings: BulkRenderingDraftShotVideoSettingsState;
  shotMaxFramesById: Map<string, number>;
  shotFpsById: Map<string, number>;
  isTeamMember: boolean;
  shotIdsWithUploadedFirstFrame: Set<string>;
}): EstimatedBulkRendersRunCredits => {
  const imageCreditsByShotId = Object.fromEntries(
    selectedShotIds.map((shotId) => [
      shotId,
      computeImageCreditsForShot(
        imageSettingsByShotId[shotId] ?? masterSettings.imageSettings,
        masterSettings.videoModel.name
      )
    ])
  );
  const shotVideoCredits = selectedShotIds.map(
    (shotId) =>
      [
        shotId,
        computeBulkRendersRunShotVideoCredits({
          shotId,
          masterSettings,
          draftShotVideoSettings,
          shotMaxFramesById,
          shotFpsById
        })
      ] as const
  );
  const videoCreditsByShotId = Object.fromEntries(
    shotVideoCredits.map(([shotId, credits]) => [shotId, credits.credits])
  );
  const isVideoCostPerShotResolved = shotVideoCredits.every(
    ([, credits]) => credits.isFrameLengthResolved
  );

  return {
    estimatedRunCredits: estimateBulkRendersRunCredits({
      imageCreditsByShotId,
      videoCreditsByShotId,
      selectedShotIds,
      shotIdsWithUploadedFirstFrame
    }),
    isVideoCostPerShotResolved
  };
};
