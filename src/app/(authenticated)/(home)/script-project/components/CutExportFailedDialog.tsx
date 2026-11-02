import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

const DIALOG_WIDTH_PX = 460;
const DIALOG_HEIGHT_PX = 260;

type Props = {
  isOpen: boolean;
  reasonLabel: string;
  isDownloadingZip: boolean;
  onCancel: () => void;
  onDownloadZip: () => void;
};

export const CutExportFailedDialog: React.FC<Props> = ({
  isOpen,
  reasonLabel,
  isDownloadingZip,
  onCancel,
  onDownloadZip
}) => {
  const { t } = useTranslation();

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) onCancel();
      }}
      size={{
        mode: "fixed",
        widthPx: DIALOG_WIDTH_PX,
        heightPx: DIALOG_HEIGHT_PX
      }}
    >
      <div
        className="flex h-full w-full flex-col justify-between gap-4 p-6"
        data-testid="cut-export-failed-dialog"
      >
        <div className="flex flex-col gap-2">
          <Text component="h4" variant="lg" weight="semibold">
            {t("script_project.export_failed_title.label")}
          </Text>
          <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
            {reasonLabel}
          </Text>
          <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
            {t("script_project.export_failed_offer_zip.label")}
          </Text>
        </div>

        <div className="flex items-center justify-end gap-3">
          <MainButton
            colorScheme="secondary"
            isDisabled={isDownloadingZip}
            onPress={onCancel}
            data-testid="cut-export-failed-cancel"
          >
            {t("script_project.export_failed_cancel_button.label")}
          </MainButton>
          <MainButton
            colorScheme="primary"
            isDisabled={isDownloadingZip}
            loading={isDownloadingZip}
            onPress={onDownloadZip}
            data-testid="cut-export-failed-download-zip"
          >
            {t("script_project.export_failed_download_zip_button.label")}
          </MainButton>
        </div>
      </div>
    </OverlayDialog>
  );
};
