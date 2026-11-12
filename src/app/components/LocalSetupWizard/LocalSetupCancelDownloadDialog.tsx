import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

export const LocalSetupCancelDownloadDialog = ({
  isOpen,
  filename,
  isDeleting,
  onBack,
  onDelete
}: {
  isOpen: boolean;
  filename: string;
  isDeleting: boolean;
  onBack: () => void;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={isOpen}
      onClose={() => {
        if (!isDeleting) onBack();
      }}
      width="sm"
      title={t("localSetup.requirementDownload.cancelDialog.title")}
    >
      <div className="flex flex-col gap-5">
        <Text variant="sm">
          {t("localSetup.requirementDownload.cancelDialog.description", {
            file: filename
          })}
        </Text>
        <div className="flex gap-2">
          <MainButton
            colorScheme="secondary"
            isDisabled={isDeleting}
            onPress={onBack}
          >
            {t("localSetup.requirementDownload.cancelDialog.back")}
          </MainButton>
          <MainButton
            colorScheme="danger"
            isDisabled={isDeleting}
            loading={isDeleting}
            onPress={onDelete}
          >
            {t("localSetup.requirementDownload.cancelDialog.delete")}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
