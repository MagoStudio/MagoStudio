import {
  BulkRendersRun,
  BulkRendersRunStatus,
  BulkRendersRunStep
} from "@schemas/bulkRendersRun";

import {
  IMAGE_CHAIN_TOOL_NAMES,
  VIDEO_CHAIN_TOOL_NAMES
} from "./bulkRendersRunToolChains";
import { deriveBulkRendersRunChainCompletedCounts } from "./deriveBulkRendersRunChainCompletedCounts";
import { formatBulkRendersRunElapsedTime } from "./formatBulkRendersRunElapsedTime";

type BulkRendersRunCurrentStepId = "image" | "video";

export interface BulkRendersRunInProgressRow {
  runId: string;
  runName: string | undefined;
  status: BulkRendersRunStatus;
  currentStepNumber: number | undefined;
  currentStepId: BulkRendersRunCurrentStepId | undefined;
  imageChainCompletedCount: number;
  imageTotalCount: number;
  videoChainCompletedCount: number;
  videoTotalCount: number;
  elapsedTimeLabel: string | undefined;
  progressPercent: number;
}

const deriveCurrentStep = (
  currentStep: BulkRendersRunStep | null | undefined
): {
  currentStepNumber: number | undefined;
  currentStepId: BulkRendersRunCurrentStepId | undefined;
} => {
  if (!currentStep) {
    return { currentStepNumber: undefined, currentStepId: undefined };
  }
  if (IMAGE_CHAIN_TOOL_NAMES.has(currentStep.tool_name)) {
    return { currentStepNumber: 1, currentStepId: "image" };
  }
  if (VIDEO_CHAIN_TOOL_NAMES.has(currentStep.tool_name)) {
    return { currentStepNumber: 2, currentStepId: "video" };
  }
  return { currentStepNumber: undefined, currentStepId: undefined };
};

export const mapBulkRendersRunToInProgressRow = ({
  run,
  steps,
  startedAt,
  now
}: {
  run: BulkRendersRun;
  steps: BulkRendersRunStep[];
  startedAt: string | null | undefined;
  now: Date;
}): BulkRendersRunInProgressRow => {
  const shotIds = run.input_settings?.timeline_ids ?? [];
  const hasVideoChain = !!run.input_settings?.video_settings;
  const { imageChainCompletedCount, videoChainCompletedCount } =
    deriveBulkRendersRunChainCompletedCounts({ shotIds, steps });
  const { currentStepNumber, currentStepId } = deriveCurrentStep(
    run.current_step
  );

  return {
    runId: run.id,
    runName: run.name ?? undefined,
    status: run.status,
    currentStepNumber,
    currentStepId,
    imageChainCompletedCount,
    imageTotalCount: shotIds.length,
    videoChainCompletedCount,
    videoTotalCount: hasVideoChain ? shotIds.length : 0,
    elapsedTimeLabel: formatBulkRendersRunElapsedTime({
      startedAt,
      now
    }),
    progressPercent: run.progress_pct
  };
};
