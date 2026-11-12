import type {
  ModelFileCheckKind,
  ModelFileCheckSummary,
  ModelOperationResult
} from "../../shared/modelSettings";

const FILE_CHECK_KINDS: ModelFileCheckKind[] = [
  "compatibility",
  "load",
  "hash"
];

const isModelFileCheckKind = (action: unknown): action is ModelFileCheckKind =>
  FILE_CHECK_KINDS.includes(action as ModelFileCheckKind);

export const summarizeLatestFileCheck = (
  latestCheckResult: ModelOperationResult | undefined
): ModelFileCheckSummary | null => {
  const action = latestCheckResult?.details?.action;
  const recordedAt = latestCheckResult?.details?.recordedAt;
  if (!latestCheckResult || !isModelFileCheckKind(action)) return null;
  if (typeof recordedAt !== "string") return null;
  const outcome =
    latestCheckResult.status === "success"
      ? "passed"
      : latestCheckResult.status === "unknown" ||
          latestCheckResult.status === "unsupported"
        ? "inconclusive"
        : "failed";
  return { kind: action, outcome, checkedAt: recordedAt };
};
