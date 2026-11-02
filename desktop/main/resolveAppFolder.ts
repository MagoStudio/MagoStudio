import { existsSync } from "node:fs";
import path from "node:path";

export const APP_FOLDER_NAME = "MagoStudio";
export const LEGACY_APP_FOLDER_NAME = "MagoLocal";

export const resolveAppFolder = (
  parentDirectory: string,
  folderExists: (folderPath: string) => boolean = existsSync
): string => {
  const appFolder = path.join(parentDirectory, APP_FOLDER_NAME);
  const legacyAppFolder = path.join(parentDirectory, LEGACY_APP_FOLDER_NAME);
  const onlyLegacyFolderExists =
    !folderExists(appFolder) && folderExists(legacyAppFolder);
  return onlyLegacyFolderExists ? legacyAppFolder : appFolder;
};
