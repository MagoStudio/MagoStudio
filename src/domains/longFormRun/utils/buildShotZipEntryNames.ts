export const buildShotZipEntryNames = (labels: string[]): string[] =>
  labels.map((label) => `${label}.mp4`);
