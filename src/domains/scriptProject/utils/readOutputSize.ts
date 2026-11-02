export const readOutputSize = (
  renderSpec: Record<string, unknown> | null | undefined
): [number, number] | null => {
  const outputSize = renderSpec?.output_size;
  if (!Array.isArray(outputSize) || outputSize.length !== 2) return null;
  const [widthPx, heightPx] = outputSize;
  const isPositiveFiniteEdge = (edge: unknown): edge is number =>
    typeof edge === "number" && Number.isFinite(edge) && edge > 0;
  return isPositiveFiniteEdge(widthPx) && isPositiveFiniteEdge(heightPx)
    ? [widthPx, heightPx]
    : null;
};
