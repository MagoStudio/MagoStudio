import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimeout } from "usehooks-ts";

const MODAL_LOCK_DURATION_MS = 5000;
interface Props {
  onClose: () => void;
}

export const MobileNotSupportedModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [canClose, setCanClose] = useState(false);

  useTimeout(() => {
    setCanClose(true);
  }, MODAL_LOCK_DURATION_MS);

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <Modal
      contentClassName="pb-8"
      onClose={handleClose}
      open={true}
      preventOutsideClick={!canClose}
      showCloseButton={canClose}
      width="sm"
    >
      <div className="flex flex-col items-center gap-4">
        <Icon
          iconSet="24"
          iconName="mobile-off"
          className="text-glyph-primary"
        />
        <Text align="center" variant="lg">
          {t("modals.mobile_not_supported.description")}
        </Text>
        <MainButton
          variant="outlined"
          colorScheme="danger"
          isDisabled={!canClose}
          onPress={handleClose}
        >
          {t("modals.mobile_not_supported.confirm_desktop")}
        </MainButton>
      </div>
    </Modal>
  );
};
