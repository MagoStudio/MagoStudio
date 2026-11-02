export const readSheetImageSetting = (
  settings: Record<string, unknown> | null | undefined,
  key: string
): string | null => {
  const value = settings?.[key];
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
};
