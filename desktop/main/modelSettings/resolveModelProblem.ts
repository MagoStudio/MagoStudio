import type { ModelOperationResult } from "../../shared/modelSettings";

export const resolveModelProblem = (
  component?: ModelOperationResult,
  model?: ModelOperationResult
): ModelOperationResult | null => {
  if (!component) return model ?? null;
  if (!model || !["error", "mismatch", "unsupported"].includes(model.status))
    return component;
  const recordedAt = (result: ModelOperationResult) =>
    Date.parse(String(result.details?.recordedAt)) || 0;
  return recordedAt(model) >= recordedAt(component) ? model : component;
};
