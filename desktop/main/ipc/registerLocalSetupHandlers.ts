import path from "node:path";

import { app, BrowserWindow, dialog, ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import { LibrarySettings } from "../librarySettings";
import { chooseInstallFolder } from "../localSetup/chooseInstallFolder";
import {
  MANUAL_COMFY_MODEL_COPY_MESSAGE,
  modelCopyConfirmationMessage
} from "../localSetup/confirmAndCopyInstallerModels";
import { downloadSetupRequirement } from "../localSetup/downloadSetupRequirement";
import { downloadSetupRequirements } from "../localSetup/downloadSetupRequirements";
import {
  listStorageDrives,
  readStorageSpace
} from "../localSetup/listStorageDrives";
import { probeHardware } from "../localSetup/probeHardware";
import { readLocalModelGroupsStatus } from "../localSetup/readLocalModelGroupsStatus";
import { readStarterInstallRequest } from "../localSetup/readStarterInstallRequest";
import { readVideoMemoryBytesOnce } from "../localSetup/readVideoMemoryBytesOnce";
import { StarterInstaller } from "../localSetup/starterInstaller";

import { requireTrustedSender } from "./trustedSender";

export const registerLocalSetupHandlers = (options: {
  settings: LibrarySettings;
}): void => {
  const installer = new StarterInstaller(options.settings, {
    confirmModelCopy: async (bytes) => {
      const result = await dialog.showMessageBox({
        type: "question",
        title: "Copy models to your ComfyUI?",
        message: modelCopyConfirmationMessage(bytes),
        buttons: ["Copy model files", "Keep in installation folder"],
        defaultId: 1,
        cancelId: 1,
        noLink: true
      });
      return result.response === 0;
    },
    showModelCopyError: async () => {
      await dialog.showMessageBox({
        type: "error",
        title: "Copy model files manually",
        message: MANUAL_COMFY_MODEL_COPY_MESSAGE,
        buttons: ["OK"]
      });
    }
  });
  ipcMain.handle(IPC_CHANNELS.localSetupInstallerStatus, async (event) => {
    requireTrustedSender(event);
    return {
      ...installer.status(),
      hasCompletedInstall: await options.settings.hasCompletedLocalSetup()
    };
  });
  ipcMain.handle(
    IPC_CHANNELS.localSetupInstallerStart,
    async (event, request: unknown) => {
      requireTrustedSender(event);
      return installer.start(readStarterInstallRequest(request));
    }
  );
  ipcMain.handle(IPC_CHANNELS.localSetupModelGroupsStatus, async (event) => {
    requireTrustedSender(event);
    return readLocalModelGroupsStatus(
      options.settings,
      readVideoMemoryBytesOnce
    );
  });
  ipcMain.handle(IPC_CHANNELS.localSetupInstallerPause, async (event) => {
    requireTrustedSender(event);
    await installer.pause();
  });
  ipcMain.handle(
    IPC_CHANNELS.localSetupAcceptedModelLicenseRepos,
    async (event) => {
      requireTrustedSender(event);
      return options.settings.getAcceptedModelLicenseRepos();
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.localSetupAcceptModelLicenses,
    async (event, huggingFaceRepos) => {
      requireTrustedSender(event);
      if (
        !Array.isArray(huggingFaceRepos) ||
        huggingFaceRepos.some((repo) => typeof repo !== "string")
      )
        throw new Error("Accept licenses by Hugging Face repo name.");
      await options.settings.acceptModelLicenses(huggingFaceRepos);
    }
  );
  ipcMain.handle(IPC_CHANNELS.localSetupListDrives, async (event) => {
    requireTrustedSender(event);
    const savedFolder = await options.settings.getLocalModelsRoot();
    const rootPath = savedFolder ?? app.getPath("documents");
    const preferred = {
      id: rootPath,
      name: savedFolder ? "Previously selected folder" : "Documents (default)",
      rootPath,
      freeGigabytes: await readStorageSpace(rootPath)
    };
    const drives = await listStorageDrives().catch(() => []);
    return [preferred, ...drives.filter((drive) => drive.id !== preferred.id)];
  });
  ipcMain.handle(
    IPC_CHANNELS.localSetupSelectStorageFolder,
    async (event, folderPath) => {
      requireTrustedSender(event);
      if (typeof folderPath !== "string" || !path.isAbsolute(folderPath))
        throw new Error("Choose an absolute storage folder.");
      const freeGigabytes = await readStorageSpace(folderPath);
      if (freeGigabytes === null)
        throw new Error(
          "Unable to read free space. Reconnect the drive or choose another folder."
        );
      await options.settings.setLocalModelsRoot(folderPath);
      return { folderPath, freeGigabytes };
    }
  );
  const downloads = new Map<string, AbortController>();
  const customNodesFoldersAwaitingNodePackUpdate = new Map<string, string>();
  ipcMain.handle(IPC_CHANNELS.localSetupPauseDownload, async (event, name) => {
    requireTrustedSender(event);
    downloads.get(`${event.sender.id}:${name}`)?.abort();
  });
  ipcMain.handle(
    IPC_CHANNELS.localSetupDownloadRequirement,
    async (event, name, downloadOptions: unknown) => {
      requireTrustedSender(event);
      if (typeof name !== "string") throw new Error("Invalid requirement");
      const replaceExistingNodePackIn =
        typeof downloadOptions === "object" &&
        downloadOptions !== null &&
        "replaceExistingNodePackIn" in downloadOptions &&
        typeof downloadOptions.replaceExistingNodePackIn === "string"
          ? downloadOptions.replaceExistingNodePackIn
          : undefined;
      const updateConfirmationKey = `${event.sender.id}:${name}`;
      if (
        replaceExistingNodePackIn !== undefined &&
        customNodesFoldersAwaitingNodePackUpdate.get(updateConfirmationKey) !==
          replaceExistingNodePackIn
      )
        throw new Error(
          "Confirm the node pack update from the download that asked for it."
        );
      customNodesFoldersAwaitingNodePackUpdate.delete(updateConfirmationKey);
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error("No window available");
      const key = `${event.sender.id}:${name}`;
      if (downloads.has(key))
        throw new Error("This download is already running.");
      const controller = new AbortController();
      downloads.set(key, controller);
      try {
        const result = await downloadSetupRequirement(
          window,
          {
            endpoint: await options.settings.getComfyEndpoint(),
            vlmBackend: await options.settings.getVlmBackend(),
            scriptTextModel: await options.settings.getScriptTextModel(),
            textModelProvider: await options.settings.getTextModelProvider()
          },
          name,
          controller.signal,
          { replaceExistingNodePackIn }
        );
        if (result?.outcome === "node-pack-update-needs-confirmation")
          customNodesFoldersAwaitingNodePackUpdate.set(
            updateConfirmationKey,
            result.customNodesFolder
          );
        return result;
      } finally {
        downloads.delete(key);
      }
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.localSetupDownloadRequirements,
    async (event, batchName, names) => {
      requireTrustedSender(event);
      const areNamesValid =
        typeof batchName === "string" &&
        Array.isArray(names) &&
        names.every((name) => typeof name === "string");
      if (!areNamesValid) throw new Error("Invalid requirements");
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error("No window available");
      const key = `${event.sender.id}:${batchName}`;
      if (downloads.has(key))
        throw new Error("This download is already running.");
      const controller = new AbortController();
      downloads.set(key, controller);
      try {
        return await downloadSetupRequirements(
          window,
          {
            endpoint: await options.settings.getComfyEndpoint(),
            vlmBackend: await options.settings.getVlmBackend(),
            scriptTextModel: await options.settings.getScriptTextModel(),
            textModelProvider: await options.settings.getTextModelProvider()
          },
          names as string[],
          controller.signal
        );
      } finally {
        downloads.delete(key);
      }
    }
  );
  ipcMain.handle(IPC_CHANNELS.localSetupProbeHardware, async (event) => {
    requireTrustedSender(event);
    return probeHardware();
  });

  ipcMain.handle(IPC_CHANNELS.localSetupChooseFolder, async (event) => {
    requireTrustedSender(event);
    const choice = await chooseInstallFolder(
      BrowserWindow.fromWebContents(event.sender),
      (await options.settings.getLocalModelsRoot()) ?? app.getPath("documents")
    );
    if (choice) await options.settings.setLocalModelsRoot(choice.folderPath);
    return choice;
  });
};
