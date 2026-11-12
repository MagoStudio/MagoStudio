import type {
  RequirementDownloadStatus,
  SetupRequirementDownloadResult
} from "../../shared/contracts";

export const DOWNLOAD_CANCELLED_BY_USER = "download-cancelled-by-user";

type ReportDownloadProgress = (
  downloadedBytes: number,
  totalBytes: number | null
) => void;
type ReportDownloadDestination = (destination: string) => void;

export class RequirementDownloadTracker {
  private readonly statusByRequirementName = new Map<
    string,
    RequirementDownloadStatus
  >();
  private readonly destinationByRequirementName = new Map<string, string>();

  constructor(
    private readonly deletePartialDownload: (
      destination: string
    ) => Promise<void>
  ) {}

  read(requirementName: string): RequirementDownloadStatus | null {
    return this.statusByRequirementName.get(requirementName) ?? null;
  }

  async discard(requirementName: string): Promise<void> {
    const destination = this.destinationByRequirementName.get(requirementName);
    this.statusByRequirementName.delete(requirementName);
    this.destinationByRequirementName.delete(requirementName);
    if (destination) await this.deletePartialDownload(destination);
  }

  async track(
    requirementName: string,
    signal: AbortSignal,
    download: (
      reportProgress: ReportDownloadProgress,
      reportDestination: ReportDownloadDestination
    ) => Promise<SetupRequirementDownloadResult | null>
  ): Promise<SetupRequirementDownloadResult | null> {
    const previousStatus = this.read(requirementName);
    const isResumingPartialDownload =
      previousStatus?.phase === "paused" || previousStatus?.phase === "error";
    let latestProgress = isResumingPartialDownload
      ? {
          downloadedBytes: previousStatus.downloadedBytes,
          totalBytes: previousStatus.totalBytes
        }
      : { downloadedBytes: 0, totalBytes: null };
    this.statusByRequirementName.set(requirementName, {
      phase: "downloading",
      ...latestProgress,
      error: null
    });
    try {
      const result = await download(
        (downloadedBytes, totalBytes) => {
          latestProgress = { downloadedBytes, totalBytes };
          this.statusByRequirementName.set(requirementName, {
            phase: "downloading",
            ...latestProgress,
            error: null
          });
        },
        (destination) =>
          this.destinationByRequirementName.set(requirementName, destination)
      );
      if (result?.outcome === "saved") {
        this.destinationByRequirementName.delete(requirementName);
        this.statusByRequirementName.set(requirementName, {
          phase: "done",
          ...latestProgress,
          error: null
        });
      } else this.statusByRequirementName.delete(requirementName);
      return result;
    } catch (error) {
      const wasCancelledByUser = signal.reason === DOWNLOAD_CANCELLED_BY_USER;
      if (wasCancelledByUser) {
        await this.discard(requirementName);
        return null;
      }
      this.statusByRequirementName.set(requirementName, {
        phase: signal.aborted ? "paused" : "error",
        ...latestProgress,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
