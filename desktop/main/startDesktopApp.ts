import { app } from "electron";

import { handleInstallerStartup } from "./installerStartup";
import { migrateLegacyProfile } from "./migrateLegacyProfile";
import { failStartup, installStartupDiagnostics } from "./startupDiagnostics";

export const startDesktopApp = (loadApplication: () => void): void => {
  // Squirrel launches the executable to maintain shortcuts during installation.
  // These runs must never acquire the app lock or initialize any UI/services.
  if (handleInstallerStartup()) return;
  const defaultUserDataPath = app.getPath("userData");
  const userDataPath = migrateLegacyProfile({
    appDataPath: app.getPath("appData"),
    userDataPath: defaultUserDataPath
  });
  if (userDataPath !== defaultUserDataPath)
    app.setPath("userData", userDataPath);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  installStartupDiagnostics();
  try {
    loadApplication();
  } catch (error) {
    failStartup(error);
  }
};
