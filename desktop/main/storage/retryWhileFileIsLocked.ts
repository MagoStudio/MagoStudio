import { setTimeout as waitMilliseconds } from "node:timers/promises";

const BUSY_FILE_ERROR_CODE = "EBUSY";
const WINDOWS_LOCKED_FILE_ERROR_CODES = new Set(["EPERM", "EACCES"]);
const FIRST_RETRY_DELAY_MS = 100;
const TOTAL_RETRY_WAIT_MS = 5000;

const isLockedFileError = (
  error: unknown,
  platform: NodeJS.Platform
): boolean => {
  const code = (error as NodeJS.ErrnoException).code ?? "";
  if (code === BUSY_FILE_ERROR_CODE) return true;
  return platform === "win32" && WINDOWS_LOCKED_FILE_ERROR_CODES.has(code);
};

export const retryWhileFileIsLocked = async <T>(
  operation: () => Promise<T>,
  wait: (milliseconds: number) => Promise<unknown> = waitMilliseconds,
  platform: NodeJS.Platform = process.platform
): Promise<T> => {
  let nextDelayMs = FIRST_RETRY_DELAY_MS;
  let totalWaitedMs = 0;
  for (;;) {
    try {
      return await operation();
    } catch (error) {
      const hasRetryTimeLeft = totalWaitedMs < TOTAL_RETRY_WAIT_MS;
      if (!isLockedFileError(error, platform) || !hasRetryTimeLeft) throw error;
      const delayMs = Math.min(
        nextDelayMs,
        TOTAL_RETRY_WAIT_MS - totalWaitedMs
      );
      await wait(delayMs);
      totalWaitedMs += delayMs;
      nextDelayMs *= 2;
    }
  }
};
