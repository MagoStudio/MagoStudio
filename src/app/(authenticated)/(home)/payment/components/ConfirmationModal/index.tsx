import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

interface Props {
  confirmButtonText: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({
  confirmButtonText,
  description,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      centeredTitle
      onClose={onClose}
      open={isOpen}
      title={t("notifications.are_you_sure.description")}
      width="sm"
    >
      <div className="flex flex-col items-center gap-2">
        <Text align="center" color="glyph-primary" select="none" variant="sm">
          {description}
        </Text>
        <div className="flex items-center justify-center gap-4 mt-2">
          <MainButton
            variant="outlined"
            colorScheme="danger"
            onPress={handleConfirm}
          >
            {confirmButtonText}
          </MainButton>
          <MainButton
            variant="outlined"
            colorScheme="onColor"
            onPress={onClose}
          >
            {t("actions.back_to_plans.label")}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
