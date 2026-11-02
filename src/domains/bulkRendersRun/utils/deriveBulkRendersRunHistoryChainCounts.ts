import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import {
  BulkRendersRunShotImageCardState,
  deriveBulkRendersRunShotImageCardState
} from "./deriveBulkRendersRunShotImageCardState";
import {
  BulkRendersRunShotVideoCardState,
  deriveBulkRendersRunShotVideoCardState
} from "./deriveBulkRendersRunShotVideoCardState";

export interface BulkRendersRunHistoryChainCounts {
  imageChainCompletedCount: number;
  imageChainErrorCount: number;
  videoChainCompletedCount: number;
  videoChainErrorCount: number;
}

const isShotChainProduced = (
  cardState: BulkRendersRunShotImageCardState | BulkRendersRunShotVideoCardState
): boolean => cardState === "ready";

const isShotChainInErrorState = (
  cardState: BulkRendersRunShotImageCardState | BulkRendersRunShotVideoCardState
): boolean =>
  cardState === "qualityFailure" || cardState === "infrastructureFailure";

export const deriveBulkRendersRunHistoryChainCounts = ({
  shotIds,
  videoShotIds,
  steps
}: {
  shotIds: string[];
  videoShotIds: string[];
  steps: BulkRendersRunStep[];
}): BulkRendersRunHistoryChainCounts => {
  const shotStepsById = (shotId: string): BulkRendersRunStep[] =>
    steps.filter((step) => step.timeline_id === shotId);

  const imageCardStates = shotIds.map((shotId) =>
    deriveBulkRendersRunShotImageCardState(shotStepsById(shotId))
  );
  const videoCardStates = videoShotIds.map((shotId) =>
    deriveBulkRendersRunShotVideoCardState(shotStepsById(shotId))
  );

  return {
    imageChainCompletedCount:
      imageCardStates.filter(isShotChainProduced).length,
    imageChainErrorCount: imageCardStates.filter(isShotChainInErrorState)
      .length,
    videoChainCompletedCount:
      videoCardStates.filter(isShotChainProduced).length,
    videoChainErrorCount: videoCardStates.filter(isShotChainInErrorState).length
  };
};
