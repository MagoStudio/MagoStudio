import { ONBOARDING_SEARCH_PARAM, ROUTES } from "@config/constants";
import {
  ONBOARDING_DIAGNOSTICS_HISTORY_LOG_KEY,
  ONBOARDING_DIAGNOSTICS_RELOAD_COUNT_KEY
} from "@domains/onboarding/constants";
import {
  formatHistoryMutation,
  getNavigationKind
} from "@domains/onboarding/utils/classifyOnboardingReload";
import {
  appendMutationRecord,
  extractStackTop,
  parseMutationLog,
  serializeMutationLog
} from "@domains/onboarding/utils/historyMutationLog";
import { isReloadedOnboardingLanding } from "@domains/onboarding/utils/isReloadedOnboardingLanding";
import { normalizeRoute } from "@domains/onboarding/utils/normalizeRoute";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useMountEffect } from "@hooks/useMountEffect";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useOnboardingProgress } from "./useOnboardingProgress";

const HISTORY_OBSERVER_FLAG = "__magoOnboardingHistoryObserved";

const recordHistoryMutation = (
  method: "pushState" | "replaceState",
  url: unknown
): void => {
  try {
    const buffer = parseMutationLog(
      sessionStorage.getItem(ONBOARDING_DIAGNOSTICS_HISTORY_LOG_KEY)
    );
    const next = appendMutationRecord(buffer, {
      method,
      url: typeof url === "string" ? url : "",
      stackTop: extractStackTop(new Error().stack)
    });
    sessionStorage.setItem(
      ONBOARDING_DIAGNOSTICS_HISTORY_LOG_KEY,
      serializeMutationLog(next)
    );
  } catch {
    return;
  }
};

const installHistoryMutationObserver = (): void => {
  if (typeof window === "undefined") return;
  const flagged = window as unknown as Record<string, boolean>;
  if (flagged[HISTORY_OBSERVER_FLAG]) return;
  flagged[HISTORY_OBSERVER_FLAG] = true;

  (["pushState", "replaceState"] as const).forEach((method) => {
    const original = history[method].bind(history);
    history[method] = function patched(
      this: History,
      ...args: Parameters<History["pushState"]>
    ): void {
      recordHistoryMutation(method, args[2]);
      return original(...args);
    };
  });
};

const nextReloadCount = (): number => {
  try {
    const current = Number(
      sessionStorage.getItem(ONBOARDING_DIAGNOSTICS_RELOAD_COUNT_KEY) ?? "0"
    );
    const next = Number.isFinite(current) ? current + 1 : 1;
    sessionStorage.setItem(
      ONBOARDING_DIAGNOSTICS_RELOAD_COUNT_KEY,
      String(next)
    );
    return next;
  } catch {
    return 1;
  }
};

const buildReloadDiagnostic = (lostStep: string) => {
  const navEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return {
    navigation_kind: getNavigationKind(navEntry?.type),
    document_referrer: document.referrer,
    lost_step: lostStep,
    reload_count_this_session: nextReloadCount(),
    recent_history_mutations: parseMutationLog(
      sessionStorage.getItem(ONBOARDING_DIAGNOSTICS_HISTORY_LOG_KEY)
    ).map(formatHistoryMutation)
  };
};

export const useOnboardingReloadDiagnostics = (): void => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [{ step }] = useOnboardingProgress();

  const isOnboardingProjectPath =
    normalizeRoute(pathname ?? "") === normalizeRoute(ROUTES.PROJECT) &&
    searchParams.get(ONBOARDING_SEARCH_PARAM) === "1";
  const isReloaded = isReloadedOnboardingLanding({
    isOnboardingProjectPath,
    step
  });

  const hasEmittedRef = useRef(false);

  useMountEffect(() => {
    installHistoryMutationObserver();
  });

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: emit the analytics event once when a reloaded landing is detected (auth may resolve after mount)
  useEffect(() => {
    if (!isReloaded || hasEmittedRef.current) return;
    hasEmittedRef.current = true;
    trackingUtils.onboardingDiagnostics.hardReloadDetected(
      buildReloadDiagnostic(step)
    );
  }, [isReloaded, step]);
};
