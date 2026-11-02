export const hasPreservableValue = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined;
};
