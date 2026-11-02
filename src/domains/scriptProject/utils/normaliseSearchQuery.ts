export const normaliseSearchQuery = (
  value: string | null | undefined
): string => (value ?? "").trim().toLocaleLowerCase();
