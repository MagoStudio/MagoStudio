export const generateUntitledName = (
  existingNames: string[],
  prefix: string
): string => {
  const nameSet = new Set(existingNames);
  if (!nameSet.has(prefix)) return prefix;

  const existingNumbers = existingNames
    .filter((name) => name.startsWith(prefix))
    .map((name) => {
      const suffix = name.slice(prefix.length);
      const match = suffix.match(/^_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const padded = String(nextNumber).padStart(2, "0");
  return `${prefix}_${padded}`;
};
