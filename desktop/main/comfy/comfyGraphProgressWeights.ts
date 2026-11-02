import type { ComfyGraph } from "./comfyGraph";

const DEFAULT_NODE_WEIGHT = 1;

const positiveNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;

const samplerStepCount = (inputs: Record<string, unknown>): number | null => {
  const totalSteps = positiveNumber(inputs.steps);
  if (!totalSteps) return null;
  const startStep =
    typeof inputs.start_at_step === "number" ? inputs.start_at_step : 0;
  const endStep =
    typeof inputs.end_at_step === "number"
      ? Math.min(inputs.end_at_step, totalSteps)
      : totalSteps;
  return positiveNumber(endStep - startStep) ?? DEFAULT_NODE_WEIGHT;
};

export const comfyGraphProgressWeights = (
  graph: ComfyGraph
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(graph).map(([nodeId, node]) => [
      nodeId,
      samplerStepCount(node.inputs ?? {}) ?? DEFAULT_NODE_WEIGHT
    ])
  );
