import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import { IMAGE_CHAIN_TOOL_NAMES } from "./bulkRendersRunToolChains";

export type BulkRendersRunShotImageCardState =
  | "pending"
  | "rendering"
  | "ready"
  | "qualityFailure"
  | "infrastructureFailure";

const QUALITY_FAILURE_TOOL_NAMES = new Set([
  "img_quality_final",
  "poll_img_retry"
]);

export const deriveBulkRendersRunShotImageCardState = (
  shotSteps: BulkRendersRunStep[]
): BulkRendersRunShotImageCardState => {
  const imageSteps = shotSteps.filter((step) =>
    IMAGE_CHAIN_TOOL_NAMES.has(step.tool_name)
  );

  const failedImageStep = imageSteps.find((step) => step.status === "FAILED");
  if (failedImageStep) {
    return QUALITY_FAILURE_TOOL_NAMES.has(failedImageStep.tool_name)
      ? "qualityFailure"
      : "infrastructureFailure";
  }

  if (imageSteps.length === 0) return "pending";

  const isEveryImageStepDone = imageSteps.every(
    (step) => step.status === "COMPLETED" || step.status === "SKIPPED"
  );
  if (isEveryImageStepDone) return "ready";

  const hasStartedImageStep = imageSteps.some(
    (step) => step.status !== "PENDING"
  );
  return hasStartedImageStep ? "rendering" : "pending";
};
