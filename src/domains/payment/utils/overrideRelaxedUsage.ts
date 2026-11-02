import { BalanceWithComputedFields } from "@domains/payment/interface";

const MILLISECONDS_PER_SECOND = 1000;

export interface RelaxedUsageOverride {
  dayUsedPct: number | null;
  dayResetAt: string | null;
  weekUsedPct: number | null;
  weekResetAt: string | null;
}

const toUnixSeconds = (datetimeLocal: string | null): number | undefined =>
  datetimeLocal
    ? Math.floor(new Date(datetimeLocal).getTime() / MILLISECONDS_PER_SECOND)
    : undefined;

export const overrideRelaxedUsage = (
  balance: BalanceWithComputedFields,
  override: RelaxedUsageOverride
): BalanceWithComputedFields => {
  if (override.dayUsedPct == null && override.weekUsedPct == null) {
    return balance;
  }

  const dayResetAt = toUnixSeconds(override.dayResetAt);
  const weekResetAt = toUnixSeconds(override.weekResetAt);

  return {
    ...balance,
    relaxed_usage: {
      ...(balance.relaxed_usage ?? {}),
      ...(override.dayUsedPct != null
        ? { day_used_pct: override.dayUsedPct }
        : {}),
      ...(override.dayUsedPct != null && dayResetAt !== undefined
        ? { day_reset_at: dayResetAt }
        : {}),
      ...(override.weekUsedPct != null
        ? { week_used_pct: override.weekUsedPct }
        : {}),
      ...(override.weekUsedPct != null && weekResetAt !== undefined
        ? { week_reset_at: weekResetAt }
        : {})
    }
  };
};
