import { Badge } from "@components/Badge";
import { CircularProgress } from "@components/CircularProgress";
import { GhostButton } from "@components/GhostButton";
import { MainButton } from "@components/MainButton";
import { Switch } from "@components/Switch";
import { Text } from "@components/Text";
import { useCancelPlan } from "@domains/plan/useCancelPlan";
import { usePlanDetail } from "@domains/plan/usePlanDetail";
import { usePlanProgress } from "@domains/plan/usePlanProgress";
import { usePlanSteps } from "@domains/plan/usePlanSteps";
import { useResumePlan } from "@domains/plan/useResumePlan";
import { buildAttentionShotDetail } from "@domains/plan/utils/buildAttentionShotDetail";
import {
  computeTimelineProgress,
  estimateTimelineProgressFromCounts
} from "@domains/plan/utils/computeTimelineProgress";
import {
  ACTIVE_PLAN_STATUSES,
  CANCELLABLE_PLAN_STATUSES
} from "@domains/plan/utils/planStatuses";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PlanFriendlyView } from "./PlanFriendlyView";
import { PlanProgressBar } from "./PlanProgressBar";
import { PlanStatusBadge } from "./PlanStatusBadge";
import { PlanStepList } from "./PlanStepList";

interface PlanDetailViewProps {
  planId: string;
  onBack: () => void;
}

const TIMELINE_ID_FALLBACK_LENGTH = 8;

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({
  planId,
  onBack
}) => {
  const { t } = useTranslation();
  const { showToast, showHintToast } = useToast();

  const { data: progress, isLoading: isProgressLoading } =
    usePlanProgress(planId);
  const planIsActive = progress
    ? ACTIVE_PLAN_STATUSES.has(progress.status)
    : isProgressLoading;
  const { data: steps, isLoading: isStepsLoading } = usePlanSteps(
    planId,
    planIsActive
  );
  const { data: planDetail, isLoading: isPlanDetailLoading } =
    usePlanDetail(planId);
  const [isDebugView, setIsDebugView] = useState(false);
  // GET /agent/plans/<id> embeds the persisted quality summary once the plan
  // is terminal — reuse the already-fetched plan detail instead of
  // a second request to the standalone /summary endpoint.
  const summary = planDetail?.summary;
  const hasSummary = !!summary?.is_final;
  // Per-shot "what went wrong" detail, keyed by timeline for the attention list.
  const failedByTid = Object.fromEntries(
    (summary?.failed_shots ?? []).map((s) => [s.timeline_id, s])
  );

  const { mutateAsync: cancelMutate, isPending: isCancelling } =
    useCancelPlan();
  const { mutateAsync: resumeMutate, isPending: isResuming } = useResumePlan();

  if (isProgressLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CircularProgress />
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const timelineProgress =
    steps && steps.length > 0
      ? computeTimelineProgress(steps)
      : estimateTimelineProgressFromCounts(
          progress.total_steps,
          progress.completed_steps
        );

  const stepCounts =
    steps && steps.length > 0
      ? {
          completedSteps: steps.filter((s) => s.status === "COMPLETED").length,
          totalSteps: steps.length
        }
      : {
          completedSteps: progress.completed_steps,
          totalSteps: progress.total_steps
        };

  const canCancel = CANCELLABLE_PLAN_STATUSES.has(progress.status);
  const canResume = progress.status === "PAUSED";

  const handleCancel = () => {
    showToast({
      message: t("plan.cancel_confirm.label"),
      onSubmit: async () => {
        await cancelMutate(planId);
        showHintToast(t("plan.plan_cancelled.label"));
      },
      onSubmitText: t("plan.cancel_confirm_yes.label"),
      onCancelText: t("plan.cancel_confirm_no.label"),
      showTimer: false
    });
  };

  const handleResume = async () => {
    await resumeMutate(planId);
    showHintToast(t("plan.plan_resumed.label"));
  };

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <div className="flex items-center gap-4">
        <GhostButton onPress={onBack}>
          {t("plan.back_to_list.label")}
        </GhostButton>

        <div className="flex flex-1 min-w-0 flex-col gap-1">
          <Text
            component="h2"
            variant="lg"
            weight="bold"
            color="glyph-primary"
            className="truncate"
          >
            {progress.name || t("plan.untitled.label")}
          </Text>
          <PlanProgressBar
            completedTimelines={timelineProgress.completedTimelines}
            totalTimelines={timelineProgress.totalTimelines}
            progressPct={timelineProgress.completionPercent}
            completedSteps={stepCounts.completedSteps}
            totalSteps={stepCounts.totalSteps}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Switch
            isSelected={isDebugView}
            onChange={setIsDebugView}
            label={t("plan.debug_view.label")}
          />
          <PlanStatusBadge status={progress.status} />
          {canResume && (
            <MainButton
              variant="solid"
              size="md"
              onPress={handleResume}
              loading={isResuming}
            >
              {t("plan.resume.label")}
            </MainButton>
          )}
          {canCancel && (
            <MainButton
              variant="outlined"
              colorScheme="danger"
              size="md"
              onPress={handleCancel}
              loading={isCancelling}
            >
              {t("plan.cancel.label")}
            </MainButton>
          )}
        </div>
      </div>

      {hasSummary && summary && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-surface-bg-100">
          <Text variant="md" weight="semibold" color="glyph-primary">
            {t("plan.summary_title.label")}
          </Text>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Text variant="sm" color="glyph-secondary">
              {t("plan.summary_runs.label", {
                passed: summary.total_amount_of_quality_passed_runs ?? 0,
                total: summary.total_amount_of_evaluated_runs ?? 0,
                rate: Math.round(summary.quality_success_rate ?? 0)
              })}
            </Text>
            <Text variant="sm" color="glyph-secondary">
              {t("plan.summary_img.label", {
                passed: summary.img_passed ?? 0,
                failed: summary.img_failed ?? 0,
                score:
                  summary.average_img_score != null
                    ? summary.average_img_score.toFixed(1)
                    : "—"
              })}
            </Text>
            {(summary.vid_passed ?? 0) + (summary.vid_failed ?? 0) > 0 && (
              <Text variant="sm" color="glyph-secondary">
                {t("plan.summary_vid.label", {
                  passed: summary.vid_passed ?? 0,
                  failed: summary.vid_failed ?? 0,
                  score:
                    summary.average_vid_score != null
                      ? summary.average_vid_score.toFixed(1)
                      : "—"
                })}
              </Text>
            )}
          </div>
          {summary.attention && summary.attention.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text variant="sm" weight="semibold" color="glyph-warning">
                {t("plan.summary_attention.label", {
                  count: summary.attention.length
                })}
              </Text>
              {summary.attention.map((a) => {
                const failed = failedByTid[a.timeline_id];
                const { weakestDims, issues } =
                  buildAttentionShotDetail(failed);
                const detail = [
                  a.img_score != null
                    ? t("plan.summary_shot_img_score.label", {
                        score: a.img_score.toFixed(1)
                      })
                    : null,
                  a.vid_score != null
                    ? t("plan.summary_shot_vid_score.label", {
                        score: a.vid_score.toFixed(1)
                      })
                    : null,
                  weakestDims.length > 0
                    ? t("plan.summary_weakest.label", {
                        dim: weakestDims.join(", ")
                      })
                    : null,
                  issues.length > 0
                    ? t("plan.summary_issues.label", {
                        issues: issues.join(", ")
                      })
                    : null
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={a.timeline_id}
                    className="flex flex-col gap-1 border-l-2 border-glyph-warning pl-3"
                  >
                    <Text variant="sm" color="glyph-primary">
                      {a.timeline_name ||
                        a.timeline_id.slice(0, TIMELINE_ID_FALLBACK_LENGTH)}
                    </Text>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(a.reasons ?? []).map((r) => (
                        <Badge key={r} glyphColor="glyph-secondary">
                          {t(`plan.attention_reason.${r}.label`, {
                            defaultValue: r
                          })}
                        </Badge>
                      ))}
                    </div>
                    {detail && (
                      <Text variant="xs" color="glyph-tertiary">
                        {detail}
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {(isStepsLoading || (!isDebugView && isPlanDetailLoading)) && (
        <div className="flex items-center justify-center py-4">
          <CircularProgress />
        </div>
      )}
      {steps && steps.length > 0 && isDebugView && (
        <PlanStepList steps={steps} planError={progress.error ?? null} />
      )}
      {steps && steps.length > 0 && !isDebugView && planDetail && (
        <PlanFriendlyView plan={planDetail} steps={steps} />
      )}
    </div>
  );
};
