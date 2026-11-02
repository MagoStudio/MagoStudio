import type { StarterInstallFile } from "../../../../../desktop/shared/contracts";

const PERCENT = 100;
const BYTES_PER_GIB = 1_073_741_824;

export const describeDownloadFileProgress = (
  file: StarterInstallFile,
  isDownloadPaused: boolean
) => {
  if (file.state === "error") return "Failed";
  if (file.state === "verifying") return "Verifying";
  const hasFileStartedDownloading =
    file.downloadedBytes > 0 && file.state !== "done";
  if (!hasFileStartedDownloading)
    return `${(file.bytes / BYTES_PER_GIB).toFixed(1)} GB`;
  const percentage = Math.min(
    PERCENT,
    Math.floor((file.downloadedBytes / Math.max(file.bytes, 1)) * PERCENT)
  );
  return isDownloadPaused ? `Paused · ${percentage}%` : `${percentage}%`;
};
