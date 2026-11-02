import path from "node:path";

import { BrowserWindow, dialog, ipcMain } from "electron";

import { resolveCloudConfig } from "../../shared/cloudConfig";
import { IPC_CHANNELS } from "../../shared/contracts";
import { parseAllowedCloudStorageUrl } from "../cloudStorage/parseAllowedCloudStorageUrl";
import { saveCloudStorageObject } from "../cloudStorage/saveCloudStorageObject";

import { requireTrustedSender } from "./trustedSender";

export const registerCloudStorageHandlers = (): void => {
  const allowedHosts = resolveCloudConfig().cloudStorageHosts;

  ipcMain.handle(
    IPC_CHANNELS.filesSaveCloudStorageObjectAs,
    async (event, value) => {
      requireTrustedSender(event);
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error("The Mago window is unavailable");
      const input = (value ?? {}) as { url?: unknown; suggestedName?: unknown };
      const objectUrl = parseAllowedCloudStorageUrl(input.url, allowedHosts);
      const suggestedName =
        typeof input.suggestedName === "string" && input.suggestedName.trim()
          ? path.basename(input.suggestedName)
          : path.posix.basename(objectUrl.pathname);
      const result = await dialog.showSaveDialog(window, {
        title: "Save download",
        defaultPath: suggestedName
      });
      if (result.canceled || !result.filePath) return false;
      await saveCloudStorageObject({
        url: objectUrl.toString(),
        allowedHosts,
        destinationPath: result.filePath
      });
      return true;
    }
  );
};
