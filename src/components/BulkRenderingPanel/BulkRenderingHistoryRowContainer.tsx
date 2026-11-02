import { useBulkRendersRunDetail } from "@domains/bulkRendersRun/useBulkRendersRunDetail";
import { useBulkRendersRunSteps } from "@domains/bulkRendersRun/useBulkRendersRunSteps";
import { mapBulkRendersRunToHistoryRow } from "@domains/bulkRendersRun/utils/mapBulkRendersRunToHistoryRow";
import { BulkRendersRun } from "@schemas/bulkRendersRun";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { BulkRenderingHistoryRow } from "./BulkRenderingHistoryRow";

interface Props {
  run: BulkRendersRun;
  isInitiallyExpanded: boolean;
}

export const BulkRenderingHistoryRowContainer: React.FC<Props> = ({
  run,
  isInitiallyExpanded
}) => {
  const { t } = useTranslation();
  const { ref: visibilityRef, isIntersecting: isRowVisible } =
    useIntersectionObserver({
      freezeOnceVisible: true,
      initialIsIntersecting: isInitiallyExpanded
    });
  const { data: detail } = useBulkRendersRunDetail(run.id, {
    enabled: isRowVisible
  });
  const { data: steps } = useBulkRendersRunSteps({
    bulkRunId: run.id,
    isBulkRendersRunActive: false,
    enabled: isRowVisible
  });

  const mappedRow = mapBulkRendersRunToHistoryRow({
    run,
    detail,
    steps
  });

  return (
    <div ref={visibilityRef}>
      <BulkRenderingHistoryRow
        run={run}
        isInitiallyExpanded={isInitiallyExpanded}
        row={{
          runId: mappedRow.runId,
          status: run.status,
          runName:
            mappedRow.runName ??
            t("bulk_rendering.run_view_untitled_run.label"),
          timestampLabel: mappedRow.timestampLabel,
          durationLabel: mappedRow.durationLabel,
          imageChainCompletedCount: mappedRow.imageChainCompletedCount,
          imageTotalCount: mappedRow.imageTotalCount,
          imageChainErrorCount: mappedRow.imageChainErrorCount,
          videoChainCompletedCount: mappedRow.videoChainCompletedCount,
          videoTotalCount: mappedRow.videoTotalCount,
          videoChainErrorCount: mappedRow.videoChainErrorCount
        }}
      />
    </div>
  );
};
