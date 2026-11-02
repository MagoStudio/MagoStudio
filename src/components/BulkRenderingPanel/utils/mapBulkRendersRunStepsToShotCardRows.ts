import { deriveBulkRendersRunShotImageCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotImageCardState";
import { deriveBulkRendersRunShotVideoCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoCardState";
import { resolveBulkRendersRunShotResultAssetId } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotResultAssetId";
import { resolveBulkRendersRunShotVideoResultRender } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotVideoResultRender";
import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import { BulkRenderingShotCardSource, BulkRenderingStepId } from "../types";

import { BulkRenderingShotResultStatus } from "./getBulkRenderingShotCardState";

const STATUS_BY_STEP_TAB_CARD_STATE: Record<
  | ReturnType<typeof deriveBulkRendersRunShotImageCardState>
  | ReturnType<typeof deriveBulkRendersRunShotVideoCardState>,
  BulkRenderingShotResultStatus
> = {
  pending: "rendering",
  rendering: "rendering",
  ready: "completed",
  qualityFailure: "failedQualityTest",
  infrastructureFailure: "unknownError"
};

export const mapBulkRendersRunStepsToShotCardRows = ({
  stepId,
  shotIds,
  shotNameById,
  steps,
  resultUrlByAssetId
}: {
  stepId: BulkRenderingStepId;
  shotIds: string[];
  shotNameById: Map<string, string>;
  steps: BulkRendersRunStep[];
  resultUrlByAssetId: Map<string, string>;
}): BulkRenderingShotCardSource[] =>
  shotIds.map((shotId) => {
    const shotSteps = steps.filter((step) => step.timeline_id === shotId);
    const isVideoStep = stepId === "video";

    const cardState = isVideoStep
      ? deriveBulkRendersRunShotVideoCardState(shotSteps)
      : deriveBulkRendersRunShotImageCardState(shotSteps);

    const imageResultAssetId = isVideoStep
      ? undefined
      : resolveBulkRendersRunShotResultAssetId(shotSteps);

    return {
      shotId,
      shotName: shotNameById.get(shotId) ?? shotId,
      status: STATUS_BY_STEP_TAB_CARD_STATE[cardState],
      imageResultUrl: imageResultAssetId
        ? resultUrlByAssetId.get(imageResultAssetId)
        : undefined,
      videoResultRender: isVideoStep
        ? resolveBulkRendersRunShotVideoResultRender(shotSteps)
        : undefined
    };
  });
