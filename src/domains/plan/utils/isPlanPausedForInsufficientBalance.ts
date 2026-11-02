import { PlanSummary } from "@schemas/plan";

const INSUFFICIENT_BALANCE_PAUSE_REASON = "insufficient_balance";
const INSUFFICIENT_BALANCE_PAUSE_MESSAGE = "Insufficient balance";

export const isPlanPausedForInsufficientBalance = (
  plan: Pick<PlanSummary, "status" | "error"> | undefined
): boolean => {
  if (plan?.status !== "PAUSED") return false;
  return (
    plan.error?.reason === INSUFFICIENT_BALANCE_PAUSE_REASON ||
    plan.error?.message === INSUFFICIENT_BALANCE_PAUSE_MESSAGE
  );
};
