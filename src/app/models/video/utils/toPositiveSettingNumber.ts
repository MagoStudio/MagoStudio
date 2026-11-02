export const toPositiveSettingNumber = (
  value: unknown,
  fallback = 0
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
