import { statfs } from "node:fs/promises";

import { BrowserWindow, dialog } from "electron";

import type { LocalSetupFolderChoice } from "../../shared/contracts";

import { BYTES_PER_GIGABYTE } from "./resolveHardwareVerdict";

export const chooseInstallFolder = async (
  window: BrowserWindow | null,
  defaultPath: string
): Promise<LocalSetupFolderChoice | null> => {
  const result = window
    ? await dialog.showOpenDialog(window, {
        defaultPath,
        properties: ["openDirectory", "createDirectory"]
      })
    : await dialog.showOpenDialog({
        defaultPath,
        properties: ["openDirectory", "createDirectory"]
      });

  const folderPath = result.filePaths[0];
  if (result.canceled || !folderPath) return null;

  try {
    const stats = await statfs(folderPath);
    return {
      folderPath,
      freeGigabytes: Number(stats.bsize * stats.bavail) / BYTES_PER_GIGABYTE
    };
  } catch {
    return { folderPath, freeGigabytes: null };
  }
};
