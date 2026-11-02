import {
  BulkRendersRunImageStepResultSchema,
  BulkRendersRunStep
} from "@schemas/bulkRendersRun";

const RESULT_ASSET_TOOL_NAME_PRECEDENCE = [
  "img_quality_final",
  "use_provided_reference_frame",
  "poll_img2img"
];

const parseCompletedStepResultAssetId = (
  step: BulkRendersRunStep
): string | undefined => {
  if (step.status !== "COMPLETED") return undefined;
  const parsedResult = BulkRendersRunImageStepResultSchema.safeParse(
    step.result
  );
  return parsedResult.success ? parsedResult.data.asset_id : undefined;
};

export const resolveBulkRendersRunShotResultAssetId = (
  shotSteps: BulkRendersRunStep[]
): string | undefined => {
  for (const toolName of RESULT_ASSET_TOOL_NAME_PRECEDENCE) {
    const stepForTool = shotSteps.find((step) => step.tool_name === toolName);
    if (!stepForTool) continue;

    const resultAssetId = parseCompletedStepResultAssetId(stepForTool);
    if (resultAssetId) return resultAssetId;
  }

  return undefined;
};
