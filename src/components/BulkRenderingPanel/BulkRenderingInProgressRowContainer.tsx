import { ROUTES } from "@config/constants";
import { useBulkRendersRunDetail } from "@domains/bulkRendersRun/useBulkRendersRunDetail";
import { useBulkRendersRunRemainingCredits } from "@domains/bulkRendersRun/useBulkRendersRunRemainingCredits";
import { useBulkRendersRunSteps } from "@domains/bulkRendersRun/useBulkRendersRunSteps";
import { useCancelBulkRendersRunWithConfirmation } from "@domains/bulkRendersRun/useCancelBulkRendersRunWithConfirmation";
import { useResumeBulkRendersRun } from "@domains/bulkRendersRun/useResumeBulkRendersRun";
import { mapBulkRendersRunToInProgressRow } from "@domains/bulkRendersRun/utils/mapBulkRendersRunToInProgressRow";
import { BulkRendersRun } from "@schemas/bulkRendersRun";
import { useToast } from "@store/useToast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useInterval, useIntersectionObserver } from "usehooks-ts";

import { BulkRenderingInProgressRow } from "./BulkRenderingInProgressRow";

const NOW_TICK_INTERVAL_MS = 1000;

const CURRENT_STEP_NAME_TRANSLATION_KEY = {
  image: "bulk_rendering.panel_row_current_step_image.label",
  video: "bulk_rendering.panel_row_current_step_video.label"
} as const;

interface Props {
  run: BulkRendersRun;
  onActivate: (runId: string) => void;
}

export const BulkRenderingInProgressRowContainer: React.FC<Props> = ({
  run,
  onActivate
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const { ref: visibilityRef, isIntersecting: isRowVisible } =
    useIntersectionObserver({ freezeOnceVisible: true });

  const { data: steps } = useBulkRendersRunSteps({
    bulkRunId: run.id,
    isBulkRendersRunActive: true,
    enabled: isRowVisible
  });
  const { data: detail } = useBulkRendersRunDetail(run.id, {
    enabled: isRowVisible
  });

  const isElapsedClockShown = isRowVisible && !!detail?.started_at;
  useInterval(
    () => setNow(new Date()),
    isElapsedClockShown ? NOW_TICK_INTERVAL_MS : null
  );

  const mappedRow = mapBulkRendersRunToInProgressRow({
    run,
    steps: steps ?? [],
    startedAt: detail?.started_at,
    now
  });
  const isPaused = mappedRow.status === "PAUSED";
  const isLocalRun =
    (run as Record<string, unknown>).local_operation === "shots";

  const { requestCancel, isCancelling } =
    useCancelBulkRendersRunWithConfirmation({
      bulkRunId: run.id,
      projectId: run.project_id ?? undefined
    });

  const { isBalanceSufficientForRemainder } = useBulkRendersRunRemainingCredits(
    {
      run,
      steps: steps ?? [],
      shotOverridesById: detail?.input_data?.shot_overrides ?? undefined
    }
  );
  const { mutate: resumeBulkRendersRun, isPending: isResuming } =
    useResumeBulkRendersRun();

  const requestContinue = () => {
    if (!isLocalRun && !isBalanceSufficientForRemainder) {
      showToast({
        message: t(
          "bulk_rendering.panel_row_resume_insufficient_credits.description"
        ),
        onSubmit: () => router.push(ROUTES.PAYMENT_CREDITS),
        onSubmitText: t("actions.buy_credits.label")
      });
      return;
    }

    resumeBulkRendersRun(
      { bulkRunId: run.id, projectId: run.project_id ?? undefined },
      {
        onError: () => {
          showToast({
            message: t(
              "notifications.bulk_renders_run_resume_failed.description"
            )
          });
        }
      }
    );
  };

  return (
    <div ref={visibilityRef}>
      <BulkRenderingInProgressRow
        row={{
          runId: mappedRow.runId,
          runName:
            mappedRow.runName ??
            t("bulk_rendering.run_view_untitled_run.label"),
          currentStepNumber: mappedRow.currentStepNumber,
          currentStepName: mappedRow.currentStepId
            ? t(CURRENT_STEP_NAME_TRANSLATION_KEY[mappedRow.currentStepId])
            : undefined,
          imageChainCompletedCount: mappedRow.imageChainCompletedCount,
          imageTotalCount: mappedRow.imageTotalCount,
          videoChainCompletedCount: mappedRow.videoChainCompletedCount,
          videoTotalCount: mappedRow.videoTotalCount,
          elapsedTimeLabel: mappedRow.elapsedTimeLabel,
          progressPercent: mappedRow.progressPercent
        }}
        isQueued={mappedRow.status === "PENDING"}
        isPaused={isPaused}
        isCancelling={isCancelling}
        isResuming={isResuming}
        onActivate={() => onActivate(run.id)}
        onCancel={requestCancel}
        onContinue={requestContinue}
      />
    </div>
  );
};
