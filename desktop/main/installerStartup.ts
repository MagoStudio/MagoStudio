import { spawn } from "node:child_process";
import path from "node:path";

import { app } from "electron";

const INSTALLER_TIMEOUT_MS = 15_000;

export const handleInstallerStartup = (): boolean => {
  if (process.platform !== "win32") return false;
  const event = process.argv[1];
  if (event === "--squirrel-obsolete") {
    app.quit();
    return true;
  }
  const action =
    event === "--squirrel-install" || event === "--squirrel-updated"
      ? "--createShortcut"
      : event === "--squirrel-uninstall"
        ? "--removeShortcut"
        : null;
  if (!action) return false;
  const updater = path.resolve(
    path.dirname(process.execPath),
    "..",
    "Update.exe"
  );
  const child = spawn(updater, [action, path.basename(process.execPath)], {
    windowsHide: true
  });
  const timeout = setTimeout(() => app.quit(), INSTALLER_TIMEOUT_MS);
  const finish = () => {
    clearTimeout(timeout);
    app.quit();
  };
  child.once("error", finish);
  child.once("exit", finish);
  return true;
};
