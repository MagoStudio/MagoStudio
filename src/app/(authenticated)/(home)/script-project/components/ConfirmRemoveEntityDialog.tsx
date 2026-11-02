import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

const DIALOG_WIDTH_PX = 460;
const DIALOG_HEIGHT_PX = 240;

type Props = {
  isOpen: boolean;
  entityName: string;
  taggedShotCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmRemoveEntityDialog: React.FC<Props> = ({
  isOpen,
  entityName,
  taggedShotCount,
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
        data-testid="confirm-remove-entity-dialog"
      >
        <div className="flex flex-col gap-2">
          <Text component="h4" variant="lg" weight="semibold">
            {t("script_project.confirm_remove_entity_title.label", {
              name: entityName
            })}
          </Text>
          <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
            {t("script_project.confirm_remove_entity_body.label", {
              count: taggedShotCount
            })}
          </Text>
        </div>

        <div className="flex items-center justify-end gap-3">
          <MainButton
            colorScheme="secondary"
            onPress={onCancel}
            data-testid="confirm-remove-entity-cancel"
          >
            {t("script_project.confirm_remove_entity_cancel_button.label")}
          </MainButton>
          <MainButton
            colorScheme="primary"
            onPress={onConfirm}
            data-testid="confirm-remove-entity-confirm"
          >
            {t("script_project.confirm_remove_entity_confirm_button.label")}
          </MainButton>
        </div>
      </div>
    </OverlayDialog>
  );
};
