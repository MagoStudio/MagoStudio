import type {
  ModelFileLoadTestOutcome,
  ModelOperationResult
} from "../../shared/modelSettings";

type FileFingerprint = { size: number; modified: number };

const FILE_CHECK_ACTIONS = ["compatibility", "load"];

export const hasModelFileCheckSucceeded = (
  recordedResult: ModelOperationResult | undefined
) =>
  recordedResult?.status === "success" &&
  FILE_CHECK_ACTIONS.includes(String(recordedResult.details?.action));

const wasRecordedForCurrentFile = (
  recordedResult: ModelOperationResult,
  currentFile: FileFingerprint | null
) =>
  currentFile !== null &&
  recordedResult.details?.size === currentFile.size &&
  recordedResult.details?.modified === currentFile.modified;

const isPassedFileCheck = (
  recordedResult: ModelOperationResult | undefined,
  currentFile: FileFingerprint | null
) =>
  recordedResult !== undefined &&
  hasModelFileCheckSucceeded(recordedResult) &&
  wasRecordedForCurrentFile(recordedResult, currentFile);

export const readModelFileCheckStatus = ({
  latestCheckResult,
  latestLoadTestResult,
  currentFile
}: {
  latestCheckResult: ModelOperationResult | undefined;
  latestLoadTestResult: ModelOperationResult | undefined;
  currentFile: FileFingerprint | null;
}): {
  hasPassedModelCheck: boolean;
  loadTestOutcome: ModelFileLoadTestOutcome;
} => {
  const isLoadTestOfCurrentFile =
    latestLoadTestResult !== undefined &&
    wasRecordedForCurrentFile(latestLoadTestResult, currentFile);
  if (!isLoadTestOfCurrentFile)
    return {
      hasPassedModelCheck: isPassedFileCheck(latestCheckResult, currentFile),
      loadTestOutcome: "untested"
    };
  const hasPassedLoadTest = isPassedFileCheck(
    latestLoadTestResult,
    currentFile
  );
  return {
    hasPassedModelCheck: hasPassedLoadTest,
    loadTestOutcome: hasPassedLoadTest ? "passed" : "failed"
  };
};
