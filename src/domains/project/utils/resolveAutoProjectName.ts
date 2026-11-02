import { deriveProjectNameFromFilename } from "./deriveProjectNameFromFilename";
import { isDefaultProjectName } from "./isDefaultProjectName";

interface ResolveAutoProjectNameParams {
  currentName: string;
  defaultName: string;
  hasExistingVideo: boolean;
  isOnboardingActive: boolean;
  filename: string;
}

export const resolveAutoProjectName = ({
  currentName,
  defaultName,
  hasExistingVideo,
  isOnboardingActive,
  filename
}: ResolveAutoProjectNameParams): string | null => {
  if (isOnboardingActive) return null;
  if (hasExistingVideo) return null;
  if (!isDefaultProjectName(currentName, defaultName)) return null;
  return deriveProjectNameFromFilename(filename);
};
