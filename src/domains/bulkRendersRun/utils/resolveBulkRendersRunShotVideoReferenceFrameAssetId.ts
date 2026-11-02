import {
  BulkRendersRunStep,
  BulkRendersRunVideoReferenceFrameStepResultSchema
} from "@schemas/bulkRendersRun";

import { VIDEO_CHAIN_TOOL_NAMES } from "./bulkRendersRunToolChains";

const parseStepReferenceFrameAssetId = (
  step: BulkRendersRunStep
): string | undefined => {
  const parsedResult =
    BulkRendersRunVideoReferenceFrameStepResultSchema.safeParse(step.result);
  return parsedResult.success
    ? parsedResult.data.ref_frame_asset_id
    : undefined;
};

export const resolveBulkRendersRunShotVideoReferenceFrameAssetId = (
  shotSteps: BulkRendersRunStep[]
): string | undefined => {
  const referenceFrameAssetIdsByStepOrder = shotSteps
    .filter((step) => VIDEO_CHAIN_TOOL_NAMES.has(step.tool_name))
    .sort((first, second) => first.step_order - second.step_order)
    .map(parseStepReferenceFrameAssetId)
    .filter(
      (referenceFrameAssetId): referenceFrameAssetId is string =>
        !!referenceFrameAssetId
    );

  return referenceFrameAssetIdsByStepOrder.at(0);
};
