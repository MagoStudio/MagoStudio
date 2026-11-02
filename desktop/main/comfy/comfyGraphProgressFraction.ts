export const comfyGraphProgressFraction = ({
  weights,
  finishedNodeIds,
  currentNodeId,
  currentNodeStepFraction
}: {
  weights: Record<string, number>;
  finishedNodeIds: ReadonlySet<string>;
  currentNodeId: string | null;
  currentNodeStepFraction: number;
}): number => {
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  if (totalWeight <= 0) return 0;
  const finishedWeight = [...finishedNodeIds].reduce(
    (sum, nodeId) => sum + (weights[nodeId] ?? 0),
    0
  );
  const isCurrentNodeUnfinished =
    currentNodeId !== null && !finishedNodeIds.has(currentNodeId);
  const currentWeight = isCurrentNodeUnfinished
    ? (weights[currentNodeId] ?? 0) *
      Math.min(1, Math.max(0, currentNodeStepFraction))
    : 0;
  return Math.min(1, (finishedWeight + currentWeight) / totalWeight);
};
