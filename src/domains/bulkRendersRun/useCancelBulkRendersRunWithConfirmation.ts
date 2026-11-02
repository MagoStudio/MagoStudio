import { bulkRenderingFlowAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useCancelBulkRendersRun } from "./useCancelBulkRendersRun";

export const useCancelBulkRendersRunWithConfirmation = ({
  bulkRunId,
  projectId
}: {
  bulkRunId: string;
  projectId: string | undefined;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const { mutate: cancelBulkRendersRun, isPending: isCancelling } =
    useCancelBulkRendersRun();

  const requestCancel = () => {
    showToast({
      message: t("bulk_rendering.run_view_cancel_confirmation.description"),
      onSubmit: () => {
        cancelBulkRendersRun(
          { bulkRunId, projectId },
          {
            onSuccess: (outcome) => {
              if (outcome.kind !== "cancelled") return;
              setBulkRenderingFlow({
                view: "panel",
                expandedHistoryRunId: bulkRunId
              });
            },
            onError: () => {
              showToast({
                message: t(
                  "notifications.bulk_renders_run_cancel_failed.description"
                )
              });
            }
          }
        );
      },
      onSubmitText: t("bulk_rendering.run_view_footer_cancel_button.label"),
      onCancelText: t(
        "bulk_rendering.run_view_cancel_confirmation_dismiss_button.label"
      )
    });
  };

  return { requestCancel, isCancelling };
};
