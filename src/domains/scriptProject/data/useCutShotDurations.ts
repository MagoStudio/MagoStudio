import { readVideoDurationSeconds } from "@app/utils/video/readVideoDurationSeconds";
import { CutShot } from "@schemas/scriptProject";
import { useQueries } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

export interface CutShotDurations {
  durationSecondsByAssetId: Record<string, number>;
  isEveryDurationSettled: boolean;
}

interface MeasurableCutShot {
  assetId: string;
  videoUrl: string;
}

const collectMeasurableCutShots = (
  cutShots: CutShot[]
): MeasurableCutShot[] => {
  const byAssetId = new Map<string, MeasurableCutShot>();

  for (const cutShot of cutShots) {
    if (!cutShot.asset_id || !cutShot.url) continue;
    byAssetId.set(cutShot.asset_id, {
      assetId: cutShot.asset_id,
      videoUrl: cutShot.url
    });
  }

  return [...byAssetId.values()];
};

export const useCutShotDurations = (cutShots: CutShot[]): CutShotDurations => {
  const measurableCutShots = collectMeasurableCutShots(cutShots);

  const results = useQueries({
    queries: measurableCutShots.map(({ assetId, videoUrl }) => ({
      queryKey: queryKeys.videoDurationSeconds.byAssetId(assetId),
      queryFn: () => readVideoDurationSeconds(videoUrl),
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1
    }))
  });

  const durationSecondsByAssetId: Record<string, number> = {};
  results.forEach((result, index) => {
    const measured = result.data;
    const assetId = measurableCutShots[index]?.assetId;
    if (assetId && typeof measured === "number") {
      durationSecondsByAssetId[assetId] = measured;
    }
  });

  return {
    durationSecondsByAssetId,
    isEveryDurationSettled: results.every(
      (result) => result.isSuccess || result.isError
    )
  };
};
