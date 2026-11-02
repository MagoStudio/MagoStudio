import {
  BulkRendersRun,
  BulkRendersRunDetail,
  BulkRendersRunStep
} from "@schemas/bulkRendersRun";

import { deriveBulkRendersRunHistoryChainCounts } from "./deriveBulkRendersRunHistoryChainCounts";
import { formatBulkRendersRunDuration } from "./formatBulkRendersRunDuration";
import { formatBulkRendersRunTimestamp } from "./formatBulkRendersRunTimestamp";

export interface BulkRendersRunHistoryRow {
  runId: string;
  runName: string | undefined;
  timestampLabel: string | undefined;
  durationLabel: string | undefined;
  imageChainCompletedCount: number | undefined;
  imageTotalCount: number | undefined;
  imageChainErrorCount: number | undefined;
  videoChainCompletedCount: number | undefined;
  videoTotalCount: number | undefined;
  videoChainErrorCount: number | undefined;
}

export const mapBulkRendersRunToHistoryRow = ({
  run,
  detail,
  steps
}: {
  run: BulkRendersRun;
  detail: BulkRendersRunDetail | undefined;
  steps: BulkRendersRunStep[] | undefined;
}): BulkRendersRunHistoryRow => {
  const shotIds = run.input_settings?.timeline_ids ?? [];
  const hasVideoChain = !!run.input_settings?.video_settings;
  const videoShotIds = hasVideoChain ? shotIds : [];
  const chainCounts = steps
    ? deriveBulkRendersRunHistoryChainCounts({ shotIds, videoShotIds, steps })
    : undefined;
  const runStartTimeIsUnknown = !detail?.started_at;
  const runStartOrCreationTimestamp = runStartTimeIsUnknown
    ? run.created_at
    : detail?.started_at;

  return {
    runId: run.id,
    runName: run.name ?? undefined,
    timestampLabel: runStartOrCreationTimestamp
      ? formatBulkRendersRunTimestamp(runStartOrCreationTimestamp)
      : undefined,
    durationLabel: formatBulkRendersRunDuration({
      startedAt: detail?.started_at,
      finishedAt: detail?.finished_at
    }),
    imageChainCompletedCount: chainCounts?.imageChainCompletedCount,
    imageTotalCount: chainCounts ? shotIds.length : undefined,
    imageChainErrorCount: chainCounts?.imageChainErrorCount,
    videoChainCompletedCount: chainCounts?.videoChainCompletedCount,
    videoTotalCount: chainCounts ? videoShotIds.length : undefined,
    videoChainErrorCount: chainCounts?.videoChainErrorCount
  };
};
