import type { StarterInstallStatus } from "../../../../../desktop/shared/contracts";

export const FAKE_FILE_DOWNLOAD_MS = 3_000;
export const FAKE_FILE_VERIFY_MS = 700;
export const FAKE_EXTRACT_MS = 3_000;

const FAKE_FILE_SLOT_MS = FAKE_FILE_DOWNLOAD_MS + FAKE_FILE_VERIFY_MS;

export const simulateStarterInstallProgress = (
  plannedInstall: StarterInstallStatus,
  elapsedMs: number,
  isFakeDownloadPaused: boolean
): StarterInstallStatus => {
  const allFilesDownloadedAtMs =
    plannedInstall.files.length * FAKE_FILE_SLOT_MS;
  const isExtracting =
    elapsedMs >= allFilesDownloadedAtMs &&
    elapsedMs < allFilesDownloadedAtMs + FAKE_EXTRACT_MS;
  const isInstallDone = elapsedMs >= allFilesDownloadedAtMs + FAKE_EXTRACT_MS;

  const files = plannedInstall.files.map((file, fileIndex) => {
    const fileElapsedMs = elapsedMs - fileIndex * FAKE_FILE_SLOT_MS;
    if (fileElapsedMs <= 0) return file;
    if (fileElapsedMs >= FAKE_FILE_SLOT_MS)
      return { ...file, downloadedBytes: file.bytes, state: "done" as const };
    if (fileElapsedMs >= FAKE_FILE_DOWNLOAD_MS)
      return {
        ...file,
        downloadedBytes: file.bytes,
        state: isFakeDownloadPaused
          ? ("waiting" as const)
          : ("verifying" as const)
      };
    return {
      ...file,
      downloadedBytes: Math.round(
        (file.bytes * fileElapsedMs) / FAKE_FILE_DOWNLOAD_MS
      ),
      state: isFakeDownloadPaused
        ? ("waiting" as const)
        : ("downloading" as const)
    };
  });

  const phase = isInstallDone
    ? "done"
    : isFakeDownloadPaused
      ? "paused"
      : isExtracting
        ? "extracting"
        : "downloading";

  return { ...plannedInstall, phase, files };
};
