import { BulkRenderingHistoryRow } from "../types";

export type BulkRenderingHistoryRowErrorSummary =
  | { status: "unavailable" }
  | { status: "clear" }
  | { status: "present"; imageErrorCount: number; videoErrorCount: number };

export function getBulkRenderingHistoryRowErrorSummary(
  row: Pick<
    BulkRenderingHistoryRow,
    "status" | "imageChainErrorCount" | "videoChainErrorCount"
  >
): BulkRenderingHistoryRowErrorSummary {
  const { status, imageChainErrorCount, videoChainErrorCount } = row;

  if (
    imageChainErrorCount === undefined ||
    videoChainErrorCount === undefined
  ) {
    return { status: "unavailable" };
  }

  const totalErrorCount = imageChainErrorCount + videoChainErrorCount;
  if (totalErrorCount === 0) {
    const runStoppedBeforeItCouldBeJudgedClean =
      status === "CANCELLED" || status === "FAILED";
    return runStoppedBeforeItCouldBeJudgedClean
      ? { status: "unavailable" }
      : { status: "clear" };
  }

  return {
    status: "present",
    imageErrorCount: imageChainErrorCount,
    videoErrorCount: videoChainErrorCount
  };
}
