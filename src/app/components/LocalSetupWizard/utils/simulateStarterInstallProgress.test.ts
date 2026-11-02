import { describe, expect, it } from "vitest";

import type { StarterInstallStatus } from "../../../../../desktop/shared/contracts";

import {
  FAKE_EXTRACT_MS,
  FAKE_FILE_DOWNLOAD_MS,
  FAKE_FILE_VERIFY_MS,
  simulateStarterInstallProgress
} from "./simulateStarterInstallProgress";

const FAKE_FILE_SLOT_MS = FAKE_FILE_DOWNLOAD_MS + FAKE_FILE_VERIFY_MS;

const plannedFile = (name: string) => ({
  name,
  url: `https://example.com/${name}`,
  destination: `models/${name}`,
  bytes: 1_000,
  downloadedBytes: 0,
  state: "waiting" as const
});

const plannedInstall: StarterInstallStatus = {
  phase: "idle",
  files: [plannedFile("first"), plannedFile("second")],
  directory: "MagoStudio",
  error: null
};

describe("fake starter install progress", () => {
  it("downloads files one after another", () => {
    const halfwayThroughFirstFile = simulateStarterInstallProgress(
      plannedInstall,
      FAKE_FILE_DOWNLOAD_MS / 2,
      false
    );
    expect(halfwayThroughFirstFile.phase).toBe("downloading");
    expect(halfwayThroughFirstFile.files[0]).toMatchObject({
      state: "downloading",
      downloadedBytes: 500
    });
    expect(halfwayThroughFirstFile.files[1].state).toBe("waiting");
  });

  it("verifies each file before marking it done", () => {
    const verifyingFirstFile = simulateStarterInstallProgress(
      plannedInstall,
      FAKE_FILE_DOWNLOAD_MS + 1,
      false
    );
    expect(verifyingFirstFile.files[0].state).toBe("verifying");
    const intoSecondFile = simulateStarterInstallProgress(
      plannedInstall,
      FAKE_FILE_SLOT_MS + 1,
      false
    );
    expect(intoSecondFile.files[0].state).toBe("done");
    expect(intoSecondFile.files[1].state).toBe("downloading");
  });

  it("extracts after the last file, then finishes", () => {
    const allFilesDownloadedAtMs = 2 * FAKE_FILE_SLOT_MS;
    expect(
      simulateStarterInstallProgress(
        plannedInstall,
        allFilesDownloadedAtMs + 1,
        false
      ).phase
    ).toBe("extracting");
    const finished = simulateStarterInstallProgress(
      plannedInstall,
      allFilesDownloadedAtMs + FAKE_EXTRACT_MS,
      false
    );
    expect(finished.phase).toBe("done");
    expect(finished.files.every((file) => file.state === "done")).toBe(true);
  });

  it("keeps partial progress while paused", () => {
    const paused = simulateStarterInstallProgress(
      plannedInstall,
      FAKE_FILE_DOWNLOAD_MS / 2,
      true
    );
    expect(paused.phase).toBe("paused");
    expect(paused.files[0]).toMatchObject({
      state: "waiting",
      downloadedBytes: 500
    });
  });
});
