import { MILLISECONDS_TO_SECONDS } from "@domains/payment/constants";

const SECONDS_PER_HOUR = 3600;

export function formatResetCountdownHours(
  resetAtSeconds: number,
  nowMs: number = Date.now()
): number {
  const diffSeconds = resetAtSeconds - nowMs / MILLISECONDS_TO_SECONDS;
  return Math.max(0, Math.ceil(diffSeconds / SECONDS_PER_HOUR));
}
