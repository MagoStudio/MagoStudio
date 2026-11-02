import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import { deriveBulkRendersRunChainCompletedCounts } from "./deriveBulkRendersRunChainCompletedCounts";

export interface BulkRendersRunRemainingShotIds {
  shotIdsOwingImageRender: string[];
  shotIdsOwingVideoRender: string[];
}

export const resolveBulkRendersRunRemainingShotIds = ({
  shotIds,
  steps
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
}): BulkRendersRunRemainingShotIds => {
  const hasShotCompletedImageChain = (shotId: string): boolean =>
    deriveBulkRendersRunChainCompletedCounts({ shotIds: [shotId], steps })
      .imageChainCompletedCount > 0;
  const hasShotCompletedVideoChain = (shotId: string): boolean =>
    deriveBulkRendersRunChainCompletedCounts({ shotIds: [shotId], steps })
      .videoChainCompletedCount > 0;

  return {
    shotIdsOwingImageRender: shotIds.filter(
      (shotId) => !hasShotCompletedImageChain(shotId)
    ),
    shotIdsOwingVideoRender: shotIds.filter(
      (shotId) => !hasShotCompletedVideoChain(shotId)
    )
  };
};
