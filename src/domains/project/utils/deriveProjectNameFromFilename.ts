import { AUTO_PROJECT_NAME_LENGTH } from "../constants";

export const deriveProjectNameFromFilename = (
  filename: string
): string | null => {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  if (baseName.length === 0) return null;
  return baseName.slice(0, AUTO_PROJECT_NAME_LENGTH);
};
