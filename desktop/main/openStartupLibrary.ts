import path from "node:path";

import { app, dialog, shell } from "electron";

import type { DatabaseManager } from "./database/databaseManager";
import {
  CorruptLibrarySettingsError,
  type LibrarySettings
} from "./librarySettings";
import {
  logStartup,
  pauseStartupTimeout,
  resumeStartupTimeout
} from "./startupDiagnostics";

const LOG_BUTTON_WITH_BACKUPS = 3;
const KEEP_FOLDER_BUTTON_WITH_BACKUPS = 4;
const KEEP_FOLDER_BUTTON_WITHOUT_BACKUPS = 3;

export const openStartupLibrary = async (
  databaseManager: Pick<DatabaseManager, "open"> &
    Partial<Pick<DatabaseManager, "listBackups" | "restoreBackup">>,
  settings: Pick<
    LibrarySettings,
    | "getLibraryRoot"
    | "getDefaultLibraryRoot"
    | "assertWritable"
    | "setLibraryRoot"
    | "recoverCorruptSettings"
  >
): Promise<boolean> => {
  let libraryRoot: string | null = null;
  let settingsFailure: CorruptLibrarySettingsError | null = null;
  try {
    libraryRoot = await settings.getLibraryRoot();
  } catch (error) {
    if (!(error instanceof CorruptLibrarySettingsError)) throw error;
    settingsFailure = error;
  }
  let replacement = false;
  let recovering = false;
  try {
    for (;;) {
      try {
        if (libraryRoot === null) throw settingsFailure;
        logStartup(`Opening library: ${libraryRoot}`);
        if (replacement) await settings.assertWritable(libraryRoot);
        await databaseManager.open(libraryRoot);
        // Keep the original selection until the replacement is usable.
        if (replacement) {
          if (settingsFailure) {
            const backupPath =
              await settings.recoverCorruptSettings(libraryRoot);
            logStartup(
              `Recovered app settings; damaged settings preserved at: ${backupPath ?? "already repaired"}`
            );
          } else {
            await settings.setLibraryRoot(libraryRoot);
          }
        }
        return true;
      } catch (error) {
        logStartup(`Failed to open library ${libraryRoot}: ${String(error)}`);
        recovering = true;
        pauseStartupTimeout();
        const backups =
          libraryRoot && databaseManager.listBackups
            ? await databaseManager.listBackups(libraryRoot).catch(() => [])
            : [];
        const keepFolder = settingsFailure
          ? (libraryRoot ?? settings.getDefaultLibraryRoot())
          : null;
        const keepFolderButtonId = backups.length
          ? KEEP_FOLDER_BUTTON_WITH_BACKUPS
          : KEEP_FOLDER_BUTTON_WITHOUT_BACKUPS;
        const choice = dialog.showMessageBoxSync({
          type: "error",
          title:
            libraryRoot === null
              ? "Mago settings damaged"
              : "Mago library unavailable",
          message:
            libraryRoot === null
              ? "Mago Studio could not read your app settings."
              : "Mago Studio could not open your library.",
          detail: `${libraryRoot ?? keepFolder ?? ""}\n\n${error instanceof Error ? error.message : String(error)}\n\n${settingsFailure ? "Keep the folder shown above, or choose your existing library folder if you used a different location. The damaged settings file will be backed up and app preferences recreated after the library opens." : "Reconnect the drive or choose another library folder. Your existing library will be kept."}`,
          buttons: [
            "Choose library folder",
            "Close",
            ...(backups.length ? ["Restore backup"] : []),
            "Open logs",
            ...(keepFolder ? ["Keep this folder"] : [])
          ],
          defaultId: 0,
          cancelId: 1
        });
        if (keepFolder && choice === keepFolderButtonId) {
          libraryRoot = keepFolder;
          replacement = true;
          continue;
        }
        if (choice === (backups.length ? LOG_BUTTON_WITH_BACKUPS : 2)) {
          shell.showItemInFolder(
            path.join(app.getPath("userData"), "logs", "startup.log")
          );
          continue;
        }
        if (
          choice === 2 &&
          backups.length &&
          libraryRoot &&
          databaseManager.restoreBackup
        ) {
          const selected = dialog.showMessageBoxSync({
            type: "warning",
            title: "Restore Mago library",
            message: "Choose a database backup to restore.",
            detail:
              "Changes after the backup will be lost. Images and videos are not included in database backups. The original database and journal files will be preserved.",
            buttons: [
              ...backups.map((file) =>
                new Date(
                  Number(path.basename(file).split("-")[1])
                ).toLocaleString()
              ),
              "Cancel"
            ],
            cancelId: backups.length,
            defaultId: backups.length
          });
          if (selected >= 0 && selected < backups.length) {
            try {
              const preserved = await databaseManager.restoreBackup(
                libraryRoot,
                backups[selected]
              );
              logStartup(
                `Restored library backup; original files preserved at ${preserved}`
              );
            } catch (restoreError) {
              logStartup(`Backup restore failed: ${String(restoreError)}`);
              dialog.showMessageBoxSync({
                type: "error",
                message: "Could not restore the backup",
                detail: String(restoreError)
              });
            }
          }
          continue;
        }
        if (choice !== 0) return false;
        const selection = dialog.showOpenDialogSync({
          title: "Choose Mago library folder",
          buttonLabel: "Use this folder",
          properties: ["openDirectory", "createDirectory"]
        });
        if (!selection?.[0]) return false;
        libraryRoot = selection[0];
        replacement = true;
      }
    }
  } finally {
    // Time spent choosing a folder must not count as a stalled startup.
    if (recovering) resumeStartupTimeout();
  }
};
