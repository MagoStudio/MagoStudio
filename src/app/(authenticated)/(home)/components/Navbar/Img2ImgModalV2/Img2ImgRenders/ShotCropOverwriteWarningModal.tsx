import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import React from "react";
import { useTranslation } from "react-i18next";

import { ShotCropOverwriteWarning } from "../hooks/utils/getShotCropOverwriteWarning";

type Props = {
  warning: ShotCropOverwriteWarning | undefined;
  onCancel: () => void;
  onConfirm: () => void;
};

const descriptionKeyByWarning: Record<ShotCropOverwriteWarning, string> = {
  replace: "notifications.img2img_use_this_replaces_crop.description",
  remove: "notifications.img2img_use_this_removes_crop.description"
};

export const ShotCropOverwriteWarningModal: React.FC<Props> = ({
  warning,
  onCancel,
  onConfirm
}) => {
  const { t } = useTranslation();

  if (!warning) return null;

  return (
    <Modal
      centeredTitle
      onClose={onCancel}
      open
      title={t("notifications.are_you_sure.description")}
      width="sm"
    >
      <div className="flex flex-col items-center gap-2">
        <Text align="center" color="glyph-primary" select="none" variant="sm">
          {t(descriptionKeyByWarning[warning])}
        </Text>
        <div className="flex items-center justify-center gap-4 mt-2">
          <MainButton
            variant="outlined"
            colorScheme="onColor"
            onPress={onCancel}
          >
            {t("actions.cancel.label")}
          </MainButton>
          <MainButton
            variant="outlined"
            colorScheme="danger"
            onPress={onConfirm}
          >
            {t("actions.continue.label")}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
