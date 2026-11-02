import type { StarterInstallStatus } from "../../../../../desktop/shared/contracts";

const RUNNING_STARTER_INSTALL_PHASES: StarterInstallStatus["phase"][] = [
  "downloading",
  "verifying",
  "extracting",
  "installing-dependencies"
];

export const isStarterInstallRunning = (
  installerStatus: StarterInstallStatus
): boolean => RUNNING_STARTER_INSTALL_PHASES.includes(installerStatus.phase);
