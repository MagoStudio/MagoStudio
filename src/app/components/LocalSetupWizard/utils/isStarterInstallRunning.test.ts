import { describe, expect, it } from "vitest";

import type { StarterInstallStatus } from "../../../../../desktop/shared/contracts";

import { isStarterInstallRunning } from "./isStarterInstallRunning";

const statusIn = (
  phase: StarterInstallStatus["phase"]
): StarterInstallStatus => ({ phase, files: [], directory: null, error: null });

describe("isStarterInstallRunning", () => {
  it("is running while files download, verify, extract or install dependencies", () => {
    for (const phase of [
      "downloading",
      "verifying",
      "extracting",
      "installing-dependencies"
    ] as const)
      expect(isStarterInstallRunning(statusIn(phase))).toBe(true);
  });

  it("is not running when idle, paused, failed or done", () => {
    for (const phase of ["idle", "paused", "error", "done"] as const)
      expect(isStarterInstallRunning(statusIn(phase))).toBe(false);
  });
});
