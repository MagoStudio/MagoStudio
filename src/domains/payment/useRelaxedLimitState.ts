import { currentTimeStore } from "@domains/payment/currentTimeStore";
import {
  RelaxedLimitWindow,
  relaxedLimitStore
} from "@domains/payment/relaxedLimitStore";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useSyncExternalStore } from "react";

const LIMIT_REACHED_PCT = 100;

interface RelaxedLimitState {
  activeLimit: RelaxedLimitWindow | null;
  resetAtSeconds: number | undefined;
  isRateLimited: boolean;
}

export function useRelaxedLimitState(): RelaxedLimitState {
  const { relaxedUsage } = useCurrentSubscription();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const hitState = useSyncExternalStore(
    relaxedLimitStore.subscribe,
    relaxedLimitStore.getSnapshot
  );

  const nowSeconds = useSyncExternalStore(
    currentTimeStore.subscribe,
    currentTimeStore.getSnapshot,
    currentTimeStore.getServerSnapshot
  );

  const isLiveHitActive = (window: RelaxedLimitWindow) => {
    const resetAt = hitState[window];
    if (resetAt === undefined || resetAt === 0) return false;
    return nowSeconds < resetAt;
  };

  const isDailyActive =
    (relaxedUsage?.day_used_pct ?? 0) >= LIMIT_REACHED_PCT ||
    isLiveHitActive("daily");
  const isWeeklyActive =
    (relaxedUsage?.week_used_pct ?? 0) >= LIMIT_REACHED_PCT ||
    isLiveHitActive("weekly");

  const activeLimit: RelaxedLimitWindow | null = isWeeklyActive
    ? "weekly"
    : isDailyActive
      ? "daily"
      : null;

  const resetAtSeconds =
    activeLimit === "weekly"
      ? (relaxedUsage?.week_reset_at ?? hitState.weekly)
      : activeLimit === "daily"
        ? (relaxedUsage?.day_reset_at ?? hitState.daily)
        : undefined;

  return {
    activeLimit,
    resetAtSeconds,
    isRateLimited: isUnlimitedModeActive && activeLimit !== null
  };
}
