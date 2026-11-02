import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import { LibrarySettings } from "../librarySettings";

import { requireTrustedSender } from "./trustedSender";

/**
 * The sign-in gate's answer. Persisting it is only half the job: the mode is
 * baked into the window through additionalArguments so the renderer can choose
 * an identity implementation at module load, so changing it has to rebuild the
 * window rather than reload it.
 */
export const registerAccountHandlers = (options: {
  settings: LibrarySettings;
  rebuildWindow: () => Promise<void>;
}): void => {
  ipcMain.handle(
    IPC_CHANNELS.accountChooseMode,
    async (event, mode: unknown) => {
      requireTrustedSender(event);
      if (mode !== "cloud" && mode !== "offline") {
        throw new Error("Unknown Mago app mode");
      }
      await options.settings.setAppMode(mode);
      await options.rebuildWindow();
    }
  );

  ipcMain.handle(IPC_CHANNELS.accountSignOut, async (event) => {
    requireTrustedSender(event);
    await options.settings.clearAppMode();
    await options.rebuildWindow();
  });
};
