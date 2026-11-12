import type {
  RequirementDownloadStatus,
  SetupRequirementDownloadResult
} from "../../../desktop/shared/contracts";
import { LOCAL_MODEL_LICENSES } from "../../../desktop/shared/localModelLicenses";

export type LocalSetupFixtureOptions = {
  initialDownload?: RequirementDownloadStatus | null;
  simulatedTotalBytes?: number;
  simulatedBytesPerSecond?: number;
};

const SIMULATION_TICK_MS = 200;
const MILLISECONDS_PER_SECOND = 1000;

export const createLocalSetupFixture = ({
  initialDownload = null,
  simulatedTotalBytes = 13_146_393_504,
  simulatedBytesPerSecond = 0
}: LocalSetupFixtureOptions = {}) => {
  let downloadStatus = initialDownload;
  let stopRunningDownload: ((reason: "paused" | "cancelled") => void) | null =
    null;
  const isDownloadSimulated = simulatedBytesPerSecond > 0;
  const downloadRequirement =
    (): Promise<SetupRequirementDownloadResult | null> => {
      if (!isDownloadSimulated) return new Promise(() => {});
      return new Promise((resolve, reject) => {
        downloadStatus = {
          phase: "downloading",
          downloadedBytes: downloadStatus?.downloadedBytes ?? 0,
          totalBytes: simulatedTotalBytes,
          error: null
        };
        const timer = window.setInterval(() => {
          if (!downloadStatus) return;
          const downloadedBytes = Math.min(
            simulatedTotalBytes,
            downloadStatus.downloadedBytes +
              (simulatedBytesPerSecond * SIMULATION_TICK_MS) /
                MILLISECONDS_PER_SECOND
          );
          downloadStatus = { ...downloadStatus, downloadedBytes };
          if (downloadedBytes < simulatedTotalBytes) return;
          window.clearInterval(timer);
          downloadStatus = { ...downloadStatus, phase: "done" };
          stopRunningDownload = null;
          resolve({ outcome: "saved", savedTo: "D:/ComfyUI/models" });
        }, SIMULATION_TICK_MS);
        stopRunningDownload = (reason) => {
          window.clearInterval(timer);
          stopRunningDownload = null;
          if (reason === "cancelled") {
            downloadStatus = null;
            resolve(null);
            return;
          }
          downloadStatus = downloadStatus && {
            ...downloadStatus,
            phase: "paused",
            error: "Download paused"
          };
          reject(new Error("Download paused"));
        };
      });
    };
  return {
    requirementDownloadStatus: async () => downloadStatus,
    downloadRequirement,
    pauseDownload: async () => stopRunningDownload?.("paused"),
    cancelDownload: async () => {
      if (stopRunningDownload) stopRunningDownload("cancelled");
      else downloadStatus = null;
    },
    acceptedModelLicenseRepos: async () =>
      LOCAL_MODEL_LICENSES.map((license) => license.huggingFaceRepo)
  };
};
