import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

import { APP_FOLDER_NAME, LEGACY_APP_FOLDER_NAME } from "./resolveAppFolder";

export const LEGACY_PRODUCT_NAME = "Mago Local";

export interface ProfileFileSystem {
  exists: (targetPath: string) => boolean;
  isEmptyDirectory: (targetPath: string) => boolean;
  removeEmptyDirectory: (targetPath: string) => void;
  rename: (fromPath: string, toPath: string) => void;
  readText: (filePath: string) => string;
  writeText: (filePath: string, text: string) => void;
}

const nodeProfileFileSystem: ProfileFileSystem = {
  exists: existsSync,
  isEmptyDirectory: (targetPath) => readdirSync(targetPath).length === 0,
  removeEmptyDirectory: rmdirSync,
  rename: renameSync,
  readText: (filePath) => readFileSync(filePath, "utf8"),
  writeText: (filePath, text) => writeFileSync(filePath, text)
};

const isInsideOrEqual = (candidatePath: string, directory: string) =>
  candidatePath === directory ||
  candidatePath.startsWith(`${directory}${path.sep}`);

const moveLegacyLibraryFolder = (
  userDataPath: string,
  fileSystem: ProfileFileSystem
): boolean => {
  const legacyLibraryPath = path.join(userDataPath, LEGACY_APP_FOLDER_NAME);
  const libraryPath = path.join(userDataPath, APP_FOLDER_NAME);
  if (!fileSystem.exists(legacyLibraryPath) || fileSystem.exists(libraryPath))
    return false;
  try {
    fileSystem.rename(legacyLibraryPath, libraryPath);
    return true;
  } catch {
    return false;
  }
};

const rewriteMovedPathsInSettings = ({
  settingsPath,
  movedPaths,
  fileSystem
}: {
  settingsPath: string;
  movedPaths: Array<{ fromPath: string; toPath: string }>;
  fileSystem: ProfileFileSystem;
}) => {
  if (!fileSystem.exists(settingsPath)) return;
  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(fileSystem.readText(settingsPath));
  } catch {
    return;
  }
  let hasRewrittenPath = false;
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value !== "string") continue;
    let rewrittenValue = value;
    for (const { fromPath, toPath } of movedPaths) {
      if (isInsideOrEqual(rewrittenValue, fromPath))
        rewrittenValue = toPath + rewrittenValue.slice(fromPath.length);
    }
    if (rewrittenValue === value) continue;
    settings[key] = rewrittenValue;
    hasRewrittenPath = true;
  }
  if (hasRewrittenPath)
    fileSystem.writeText(
      settingsPath,
      `${JSON.stringify(settings, null, 2)}\n`
    );
};

export const migrateLegacyProfile = ({
  appDataPath,
  userDataPath,
  fileSystem = nodeProfileFileSystem
}: {
  appDataPath: string;
  userDataPath: string;
  fileSystem?: ProfileFileSystem;
}): string => {
  const legacyUserDataPath = path.join(appDataPath, LEGACY_PRODUCT_NAME);
  if (legacyUserDataPath === userDataPath) return userDataPath;
  if (!fileSystem.exists(legacyUserDataPath)) return userDataPath;
  const userDataAlreadyHoldsAProfile =
    fileSystem.exists(userDataPath) &&
    !fileSystem.isEmptyDirectory(userDataPath);
  if (userDataAlreadyHoldsAProfile) return userDataPath;

  try {
    if (fileSystem.exists(userDataPath))
      fileSystem.removeEmptyDirectory(userDataPath);
    fileSystem.rename(legacyUserDataPath, userDataPath);
  } catch {
    return legacyUserDataPath;
  }

  const movedPaths = [{ fromPath: legacyUserDataPath, toPath: userDataPath }];
  if (moveLegacyLibraryFolder(userDataPath, fileSystem)) {
    movedPaths.push({
      fromPath: path.join(userDataPath, LEGACY_APP_FOLDER_NAME),
      toPath: path.join(userDataPath, APP_FOLDER_NAME)
    });
  }
  rewriteMovedPathsInSettings({
    settingsPath: path.join(userDataPath, "settings.json"),
    movedPaths,
    fileSystem
  });
  return userDataPath;
};
