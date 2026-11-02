import { BulkRendersRunShotVideoResultRender } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotVideoResultRender";
import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";

import { BulkRenderingShotResultStatus } from "./utils/getBulkRenderingShotCardState";

export type BulkRenderingStepId = "image" | "video";

export type BulkRenderingShotCardState =
  | "loaded"
  | "loading"
  | "failedQualityTest"
  | "unknownError"
  | "assetUnavailable";

export interface BulkRenderingShotCardRow {
  shotId: string;
  shotName: string;
  state: BulkRenderingShotCardState;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface BulkRenderingShotCardSource {
  shotId: string;
  shotName: string;
  status: BulkRenderingShotResultStatus;
  imageResultUrl: string | undefined;
  videoResultRender: BulkRendersRunShotVideoResultRender | undefined;
}

export interface BulkRenderingInProgressRow {
  runId: string;
  runName: string;
  currentStepNumber: number | undefined;
  currentStepName: string | undefined;
  imageChainCompletedCount: number;
  imageTotalCount: number;
  videoChainCompletedCount: number;
  videoTotalCount: number;
  elapsedTimeLabel: string | undefined;
  progressPercent: number;
}

export interface BulkRenderingHistoryRow {
  runId: string;
  runName: string;
  status: BulkRendersRunStatus;
  timestampLabel: string | undefined;
  durationLabel: string | undefined;
  imageChainCompletedCount: number | undefined;
  imageTotalCount: number | undefined;
  imageChainErrorCount: number | undefined;
  videoChainCompletedCount: number | undefined;
  videoTotalCount: number | undefined;
  videoChainErrorCount: number | undefined;
}
