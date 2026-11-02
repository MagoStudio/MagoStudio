import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

const DIALOG_WIDTH_PX = 460;
const DIALOG_HEIGHT_PX = 220;

type Props = {
  isOpen: boolean;
  entityName: string;
  staleShotCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmPinDialog: React.FC<Props> = ({
  isOpen,
  entityName,
  staleShotCount,
  onCancel,
  onConfirm
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
        data-testid="confirm-pin-dialog"
      >
        <div className="flex flex-col gap-2">
          <Text component="h4" variant="lg" weight="semibold">
            {t("script_project.confirm_pin_title.label")}
          </Text>
          <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
            {t("script_project.confirm_pin_body.label", {
              name: entityName,
              count: staleShotCount
            })}
          </Text>
        </div>

        <div className="flex items-center justify-end gap-3">
          <MainButton
            colorScheme="secondary"
            onPress={onCancel}
            data-testid="confirm-pin-cancel"
          >
            {t("script_project.confirm_pin_cancel_button.label")}
          </MainButton>
          <MainButton
            colorScheme="primary"
            onPress={onConfirm}
            data-testid="confirm-pin-confirm"
          >
            {t("script_project.confirm_pin_confirm_button.label")}
          </MainButton>
        </div>
      </div>
    </OverlayDialog>
  );
};
