import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LocalModelLicense } from "../../../../desktop/shared/localModelLicenses";

import { LocalModelLicenseList } from "./LocalModelLicenseList";

export const LocalModelLicenseDialog = ({
  isOpen,
  licenses,
  isPending,
  error,
  onClose,
  onAccept
}: {
  isOpen: boolean;
  licenses: LocalModelLicense[];
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onAccept: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      widthClassName="w-screen md:w-[460px]"
      contentClassName="p-6"
      title={t("localSetup.licenses.title")}
    >
      <div className="flex flex-col gap-3">
        <LocalModelLicenseList licenses={licenses} />

        {error && (
          <Text variant="sm" color="glyph-error">
            {error}
          </Text>
        )}

        <MainButton
          fullWidth
          colorScheme="primary"
          isDisabled={isPending}
          loading={isPending}
          onPress={onAccept}
        >
          {t("localSetup.licenses.accept")}
        </MainButton>
      </div>
    </Modal>
  );
};
