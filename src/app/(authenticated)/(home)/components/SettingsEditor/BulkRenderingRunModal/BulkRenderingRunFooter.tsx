import { MainButton } from "@components/MainButton";
import { isBulkRendersRunStatusTerminal } from "@domains/bulkRendersRun/utils/isBulkRendersRunStatusTerminal";
import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";
import { useTranslation } from "react-i18next";

interface Props {
  status: BulkRendersRunStatus | null;
  isCancelling: boolean;
  onClose: () => void;
  onCancel: () => void;
}

export const BulkRenderingRunFooter: React.FC<Props> = ({
  status,
  isCancelling,
  onClose,
  onCancel
}) => {
  const { t } = useTranslation();
  const isRunTerminal = status ? isBulkRendersRunStatusTerminal(status) : false;

  return (
    <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-end gap-2 bg-surface-secondary px-5 py-2 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]">
      <MainButton colorScheme="secondary" onPress={onClose}>
        {t("bulk_rendering.run_view_footer_close_button.label")}
      </MainButton>
      {!isRunTerminal && (
        <MainButton
          colorScheme="danger"
          loading={isCancelling}
          onPress={onCancel}
        >
          {t("bulk_rendering.run_view_footer_cancel_button.label")}
        </MainButton>
      )}
    </div>
  );
};
