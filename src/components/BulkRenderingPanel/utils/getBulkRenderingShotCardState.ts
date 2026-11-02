import { BulkRenderingShotCardState } from "../types";

export type BulkRenderingShotResultStatus =
  | "completed"
  | "rendering"
  | "failedQualityTest"
  | "unknownError";

export interface BulkRenderingShotResult {
  status: BulkRenderingShotResultStatus;
  assetUrl?: string;
  isResultPreviewLoading: boolean;
}

export function getBulkRenderingShotCardState(
  result: BulkRenderingShotResult
): BulkRenderingShotCardState {
  if (result.status === "rendering") return "loading";
  if (result.status === "failedQualityTest") return "failedQualityTest";
  if (result.status === "unknownError") return "unknownError";
  if (result.assetUrl) return "loaded";
  return result.isResultPreviewLoading ? "loading" : "assetUnavailable";
}
