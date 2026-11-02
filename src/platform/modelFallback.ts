/**
 * Returns the first selectable model only when the current selection is no
 * longer in the selectable set. An empty set has no safe automatic fallback.
 */
export const pickModelFallback = <T>(
  selectableModels: T[],
  selectedKey: string | undefined,
  getKey: (model: T) => string
): T | null => {
  if (selectableModels.some((model) => getKey(model) === selectedKey)) {
    return null;
  }
  return selectableModels[0] ?? null;
};
