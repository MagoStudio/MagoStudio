import { MainButton } from "@components/MainButton";
import { useTranslation } from "react-i18next";

interface Props {
  isCancelling: boolean;
  isResuming: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

export const BulkRenderingPausedRowActions: React.FC<Props> = ({
  isCancelling,
  isResuming,
  onCancel,
  onContinue
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <MainButton
        size="sm"
        colorScheme="danger"
        loading={isCancelling}
        onPress={onCancel}
      >
        {t("bulk_rendering.panel_row_cancel_button.label")}
      </MainButton>
      <MainButton
        size="sm"
        colorScheme="secondary"
        loading={isResuming}
        onPress={onContinue}
      >
        {t("bulk_rendering.panel_row_continue_button.label")}
      </MainButton>
    </div>
  );
};
