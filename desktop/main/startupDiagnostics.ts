import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  statSync
} from "node:fs";
import path from "node:path";
import { format } from "node:util";

import { app, dialog, shell } from "electron";

const STARTUP_TIMEOUT_MS = 60_000;
const MAX_LOG_BYTES = 2_097_152;

let logPath: string | null = null;
let startupTimer: ReturnType<typeof setTimeout> | undefined;
let reportingFailure = false;
let hasApplicationWindowBeenShown = false;

export const logStartup = (message: string): void => {
  if (!logPath) return;
  try {
    appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`, "utf8");
  } catch {
    // A full or read-only disk must not prevent the error dialog from opening.
  }
};

export const failStartup = (error: unknown): void => {
  logStartup(format("Application failure: %s", error));
  if (reportingFailure) return;
  reportingFailure = true;
  clearTimeout(startupTimer);
  void app.whenReady().then(() => {
    const choice = dialog.showMessageBoxSync({
      type: "error",
      title: "Mago Studio could not continue",
      message: "Mago Studio encountered an error.",
      detail: `${error instanceof Error ? error.message : String(error)}\n\nDiagnostic log: ${logPath ?? "unavailable (could not write to the app data folder)"}\n\nYour library has not been reset.`,
      buttons: ["Close", "Show log folder"],
      defaultId: 1,
      cancelId: 0
    });
    if (choice === 1 && logPath) shell.showItemInFolder(logPath);
    app.exit(1);
  });
};

export const startupComplete = (): void => {
  clearTimeout(startupTimer);
  hasApplicationWindowBeenShown = true;
  logStartup("Application window visible");
};

export const handleUncaughtError = (error: unknown): void => {
  if (!hasApplicationWindowBeenShown) {
    failStartup(error);
    return;
  }
  logStartup(format("Background error: %s", error));
};

export const pauseStartupTimeout = (): void => clearTimeout(startupTimer);

export const resumeStartupTimeout = (): void => {
  clearTimeout(startupTimer);
  startupTimer = setTimeout(() => {
    failStartup(
      new Error(
        "Startup did not display a window within 60 seconds. See the last startup stage in the log."
      )
    );
  }, STARTUP_TIMEOUT_MS);
};

export const installStartupDiagnostics = (): void => {
  try {
    const directory = path.join(app.getPath("userData"), "logs");
    mkdirSync(directory, { recursive: true });
    logPath = path.join(directory, "startup.log");
    if (existsSync(logPath) && statSync(logPath).size > MAX_LOG_BYTES) {
      renameSync(logPath, path.join(directory, "startup.previous.log"));
    }
  } catch {
    logPath = null;
  }
  logStartup(
    `Starting Mago Studio ${app.getVersion()} (${process.platform}); executable: ${process.execPath}`
  );
  for (const level of ["warn", "error"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      logStartup(`${level}: ${format(...args)}`);
      original(...args);
    };
  }
  process.on("uncaughtException", handleUncaughtError);
  process.on("unhandledRejection", handleUncaughtError);
  resumeStartupTimeout();
  app.on("before-quit", () => clearTimeout(startupTimer));
};
