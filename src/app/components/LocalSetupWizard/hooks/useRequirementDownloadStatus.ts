import { useQuery } from "@tanstack/react-query";

const REQUIREMENT_DOWNLOAD_POLL_MS = 1000;

export const useRequirementDownloadStatus = (
  requirementName: string,
  isDownloadStartedFromThisRow: boolean
) =>
  useQuery({
    queryKey: ["requirement-download-status", requirementName],
    queryFn: () =>
      window.mago.localSetup.requirementDownloadStatus(requirementName),
    enabled:
      typeof window.mago?.localSetup?.requirementDownloadStatus === "function",
    refetchInterval: (query) =>
      isDownloadStartedFromThisRow || query.state.data?.phase === "downloading"
        ? REQUIREMENT_DOWNLOAD_POLL_MS
        : false
  }).data ?? null;
