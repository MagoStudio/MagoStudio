import {
  BulkRendersRunStep,
  BulkRendersRunVideoMetricsStepResultSchema
} from "@schemas/bulkRendersRun";

import {
  VIDEO_CHAIN_TOOL_NAMES,
  VIDEO_QUALITY_MEASUREMENT_TOOL_NAMES,
  VIDEO_QUALITY_METRICS_POLL_TOOL_NAME
} from "./bulkRendersRunToolChains";

export type BulkRendersRunShotVideoCardState =
  | "pending"
  | "rendering"
  | "ready"
  | "qualityFailure"
  | "infrastructureFailure";

const METRICS_EVALUATION_COMPLETED_STATUS = "COMPLETED";

const didVideoStepReportFailedQuality = (step: BulkRendersRunStep): boolean => {
  const parsedResult = BulkRendersRunVideoMetricsStepResultSchema.safeParse(
    step.result
  );
  if (!parsedResult.success) return false;

  const { status, vid_pass } = parsedResult.data.video_metrics;
  const wasQualityEvaluated = status === METRICS_EVALUATION_COMPLETED_STATUS;

  return wasQualityEvaluated && vid_pass === false;
};

export const deriveBulkRendersRunShotVideoCardState = (
  shotSteps: BulkRendersRunStep[]
): BulkRendersRunShotVideoCardState => {
  const videoSteps = shotSteps.filter((step) =>
    VIDEO_CHAIN_TOOL_NAMES.has(step.tool_name)
  );

  const hasFailedNonQualityMeasurementStep = videoSteps.some(
    (step) =>
      !VIDEO_QUALITY_MEASUREMENT_TOOL_NAMES.has(step.tool_name) &&
      step.status === "FAILED"
  );

  if (hasFailedNonQualityMeasurementStep) {
    return "infrastructureFailure";
  }

  if (videoSteps.length === 0) return "pending";

  const hasFailedQualityMeasurementStep = videoSteps.some(
    (step) =>
      VIDEO_QUALITY_MEASUREMENT_TOOL_NAMES.has(step.tool_name) &&
      step.status === "FAILED"
  );

  const isEveryVideoStepDone = videoSteps.every(
    (step) => step.status === "COMPLETED" || step.status === "SKIPPED"
  );

  const isVideoChainSettled =
    isEveryVideoStepDone || hasFailedQualityMeasurementStep;

  if (isVideoChainSettled) {
    const lastEvaluatedVideoMetricsStep = videoSteps
      .filter(
        (step) =>
          step.tool_name === VIDEO_QUALITY_METRICS_POLL_TOOL_NAME &&
          step.status === "COMPLETED"
      )
      .sort((first, second) => first.step_order - second.step_order)
      .at(-1);

    const hasFailedVideoQuality =
      !!lastEvaluatedVideoMetricsStep &&
      didVideoStepReportFailedQuality(lastEvaluatedVideoMetricsStep);

    return hasFailedVideoQuality ? "qualityFailure" : "ready";
  }

  const hasStartedVideoStep = videoSteps.some(
    (step) => step.status !== "PENDING"
  );
  return hasStartedVideoStep ? "rendering" : "pending";
};
