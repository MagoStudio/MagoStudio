import type { ComfyStatus } from "../../../../../desktop/shared/contracts";

export const COMFY_LAUNCH_CHECK_INTERVAL_MS = 10_000;
export const COMFY_LAUNCH_TIMEOUT_MS = 300_000;

export type ComfyResponseWaitOutcome =
  | { outcome: "responded"; comfyStatus: ComfyStatus }
  | {
      outcome: "launched-process-exited";
      exitCode: number | null;
      reportedFailureReason: string | null;
    }
  | { outcome: "timed-out" }
  | { outcome: "cancelled" };

const sleepUnlessCancelled = (durationMs: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, durationMs);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });

const checkComfyStatusIgnoringFailures = async (
  checkComfyStatus: () => Promise<ComfyStatus>
): Promise<ComfyStatus | null> => {
  try {
    return await checkComfyStatus();
  } catch {
    return null;
  }
};

export const waitForComfyToRespond = async ({
  checkComfyStatus,
  launchStartedAtMs = Date.now(),
  checkIntervalMs = COMFY_LAUNCH_CHECK_INTERVAL_MS,
  timeoutMs = COMFY_LAUNCH_TIMEOUT_MS,
  signal,
  onCheck
}: {
  checkComfyStatus: () => Promise<ComfyStatus>;
  launchStartedAtMs?: number;
  checkIntervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onCheck?: (checkCount: number) => void;
}): Promise<ComfyResponseWaitOutcome> => {
  const deadlineMs = launchStartedAtMs + timeoutMs;
  let checkCount = 0;
  while (!signal?.aborted) {
    const comfyStatus =
      await checkComfyStatusIgnoringFailures(checkComfyStatus);
    if (signal?.aborted) break;
    checkCount += 1;
    onCheck?.(checkCount);
    if (comfyStatus?.available) return { outcome: "responded", comfyStatus };
    if (comfyStatus?.launchedProcess?.status === "exited")
      return {
        outcome: "launched-process-exited",
        exitCode: comfyStatus.launchedProcess.exitCode,
        reportedFailureReason: comfyStatus.launchedProcess.reportedFailureReason
      };
    const remainingMs = deadlineMs - Date.now();
    if (remainingMs <= 0) return { outcome: "timed-out" };
    await sleepUnlessCancelled(Math.min(checkIntervalMs, remainingMs), signal);
  }
  return { outcome: "cancelled" };
};
