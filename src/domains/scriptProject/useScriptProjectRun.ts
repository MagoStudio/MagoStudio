import { ROUTES } from "@config/constants";
import { usePlanProgress } from "@domains/plan/usePlanProgress";
import { isPlanPausedForInsufficientBalance } from "@domains/plan/utils/isPlanPausedForInsufficientBalance";
import { useToast } from "@store/useToast";
/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: the plan settles in the backend, not from a user event, and the tabs must refetch and advance when it does */
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

import { SCRIPT_PROJECT_TAB_IDS } from "./constants";
import { isPlanRunFailed } from "./utils/isPlanRunFailed";
import { isPlanRunFinished } from "./utils/isPlanRunFinished";

const RUN_POLL_INTERVAL_MS = 3000;

export type ScriptProjectRun = {
  planId: string;
  advanceToTabId?: string;
  ownerTabId: string;
  sheetTokens?: string[];
  shotTimelineIds?: string[];
};

export const useScriptProjectRun = (
  projectId: string,
  onRunAdvancesTab: (advanceToTabId: string) => void,
  recoveredRun: ScriptProjectRun | null = null
) => {
  const { t } = useTranslation();
  const { showToast, showErrorToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeRun, setActiveRun] = useState<ScriptProjectRun | null>(null);
  const settledPlanIdRef = useRef<string | null>(null);
  const progressErrorReportedPlanIdRef = useRef<string | null>(null);
  const insufficientCreditsReportedPlanIdRef = useRef<string | null>(null);

  /* Navigation unmounts this hook, but the plan itself keeps running. Desktop
   * can recover the durable plan id from its project snapshot and reattach the
   * same progress lifecycle when this page mounts again. */
  if (recoveredRun && activeRun?.planId !== recoveredRun.planId) {
    setActiveRun(recoveredRun);
  }

  const {
    data: planProgress,
    isError: hasRunProgressErrored,
    refetch: refetchRunProgress
  } = usePlanProgress(activeRun?.planId ?? "", RUN_POLL_INTERVAL_MS);

  const hasRunFinished = isPlanRunFinished(planProgress?.status);
  const hasRunFailed = isPlanRunFailed(planProgress?.status);
  const isRunPausedForInsufficientCredits =
    isPlanPausedForInsufficientBalance(planProgress);
  /* A progress fetch that keeps failing never reports a terminal status, so treating only
   * `hasRunFinished` as the end left every tab's Generate button disabled for good. */
  const hasRunSettled =
    hasRunFinished ||
    hasRunProgressErrored ||
    isRunPausedForInsufficientCredits;
  const isRunActive = !!activeRun && !hasRunSettled;

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-live-state-to-parent -- the plan settling is a backend event polled on a timer, not a user event the caller could own */
  useEffect(() => {
    if (!activeRun) return;

    /* Tracked on its own ref, so a progress fetch that recovers still advances the user when the
     * run really finishes. Sharing `settledPlanIdRef` would have consumed the plan's one chance. */
    if (hasRunProgressErrored) {
      if (progressErrorReportedPlanIdRef.current === activeRun.planId) return;
      progressErrorReportedPlanIdRef.current = activeRun.planId;
      showErrorToast({
        message: t("script_project.run_progress_unavailable.description"),
        onRetry: () => void refetchRunProgress()
      });
      return;
    }

    const hasRunLeftItsCreditsPause =
      !isRunPausedForInsufficientCredits &&
      insufficientCreditsReportedPlanIdRef.current === activeRun.planId;
    if (hasRunLeftItsCreditsPause) {
      insufficientCreditsReportedPlanIdRef.current = null;
    }

    if (isRunPausedForInsufficientCredits) {
      if (insufficientCreditsReportedPlanIdRef.current === activeRun.planId) {
        return;
      }
      insufficientCreditsReportedPlanIdRef.current = activeRun.planId;
      showToast({
        message: t(
          "script_project.run_paused_insufficient_credits.description"
        ),
        showTimer: false,
        autoDismiss: false,
        onCancel: () => router.push(ROUTES.PAYMENT_CREDITS),
        onCancelText: t("actions.buy_credits.label"),
        onSubmitText: t("actions.dismiss.label"),
        invertedSubmitAndCancelColors: true
      });
      return;
    }

    if (!hasRunFinished) return;
    if (settledPlanIdRef.current === activeRun.planId) return;
    settledPlanIdRef.current = activeRun.planId;

    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectState.byProjectId(projectId)
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectCut.byProjectId(projectId)
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.project.byId(projectId)
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectScriptVersions.byProjectId(projectId)
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bulkRendersRuns.all
    });

    /* Only a run that delivered advances the user. Advancing on a failure landed them on the
     * next tab's empty state with nothing saying why. */
    if (hasRunFailed) {
      showErrorToast({ message: t("script_project.run_failed.description") });
      return;
    }

    /* Casting may rename an Untitled project in the desktop/backend service.
     * Project queries are intentionally long-lived, so explicitly refresh every
     * title-bearing cache once that casting run has committed its output. */
    if (activeRun.ownerTabId === SCRIPT_PROJECT_TAB_IDS.script) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(projectId)
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectList.all
      });
    }

    if (activeRun.advanceToTabId) {
      onRunAdvancesTab(activeRun.advanceToTabId);
    }
  }, [
    activeRun,
    hasRunFinished,
    hasRunFailed,
    hasRunProgressErrored,
    isRunPausedForInsufficientCredits,
    router,
    projectId,
    queryClient,
    onRunAdvancesTab,
    refetchRunProgress,
    showToast,
    showErrorToast,
    t
  ]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-live-state-to-parent */

  return {
    startRun: (run: ScriptProjectRun) => {
      setActiveRun(run);
      // The navbar Plans control may have cached an empty list and therefore
      // stopped polling. The later timeline-backed render also belongs in the
      // Bulk Rendering tracker, so refresh both navbar data sources.
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.all
      });
    },
    isRunActive,
    runOwnerTabId: isRunActive ? (activeRun?.ownerTabId ?? null) : null,
    renderingSheetTokens: new Set(
      isRunActive ? (activeRun?.sheetTokens ?? []) : []
    ),
    renderingShotTimelineIds: new Set(
      isRunActive ? (activeRun?.shotTimelineIds ?? []) : []
    ),
    runProgressPercent: planProgress?.progress_pct ?? 0,
    runStepsCompleted: planProgress?.completed_steps ?? 0,
    runStepsTotal: planProgress?.total_steps ?? 0
  };
};
