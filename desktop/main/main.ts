import { startDesktopApp } from "./startDesktopApp";

// Installer events must finish before starting the renderer or taking its port.
startDesktopApp(() => {
  // Load synchronously: Chromium's host resolver switch must be installed
  // before Electron starts its network service.
  require("./application");
});
