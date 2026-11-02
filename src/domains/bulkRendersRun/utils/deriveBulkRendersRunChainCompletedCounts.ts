import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import {
  IMAGE_CHAIN_TOOL_NAMES,
  VIDEO_CHAIN_TOOL_NAMES
} from "./bulkRendersRunToolChains";

export interface BulkRendersRunChainCompletedCounts {
  imageChainCompletedCount: number;
  videoChainCompletedCount: number;
}

const isChainStepDone = (step: BulkRendersRunStep): boolean =>
  step.status === "COMPLETED" || step.status === "SKIPPED";

const countShotsWithChainReachedTerminalStep = ({
  shotIds,
  steps,
  chainToolNames
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
  chainToolNames: Set<string>;
}): number =>
  shotIds.filter((shotId) => {
    const shotChainSteps = steps.filter(
      (step) =>
        step.timeline_id === shotId && chainToolNames.has(step.tool_name)
    );
    return shotChainSteps.length > 0 && shotChainSteps.every(isChainStepDone);
  }).length;

export const deriveBulkRendersRunChainCompletedCounts = ({
  shotIds,
  steps
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
}): BulkRendersRunChainCompletedCounts => ({
  imageChainCompletedCount: countShotsWithChainReachedTerminalStep({
    shotIds,
    steps,
    chainToolNames: IMAGE_CHAIN_TOOL_NAMES
  }),
  videoChainCompletedCount: countShotsWithChainReachedTerminalStep({
    shotIds,
    steps,
    chainToolNames: VIDEO_CHAIN_TOOL_NAMES
  })
});
