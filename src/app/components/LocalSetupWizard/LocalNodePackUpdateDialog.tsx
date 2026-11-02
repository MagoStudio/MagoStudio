import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { LocalNodePackUpdateFolderRow } from "./LocalNodePackUpdateFolderRow";

export const LocalNodePackUpdateDialog = ({
  nodePackDirectory,
  backupsFolder,
  onCancel,
  onConfirm
}: {
  nodePackDirectory: string | null;
  backupsFolder: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();
  const nodePackName = nodePackDirectory?.split(/[\\/]/).at(-1) ?? "";

  return (
    <Modal
      open={nodePackDirectory !== null}
      onClose={onCancel}
      widthClassName="w-screen md:w-[460px]"
      contentClassName="p-6"
      title={t("localSetup.nodePackUpdate.title")}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text variant="sm" color="glyph-secondary">
            {t("localSetup.nodePackUpdate.outdated", { nodePackName })}
          </Text>
          <Text variant="sm" color="glyph-secondary">
            {t("localSetup.nodePackUpdate.steps")}
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <LocalNodePackUpdateFolderRow
            label={t("localSetup.nodePackUpdate.installedFolder")}
            folder={nodePackDirectory ?? ""}
          />
          <LocalNodePackUpdateFolderRow
            label={t("localSetup.nodePackUpdate.backupFolder")}
            folder={backupsFolder}
          />
        </div>
        <div className="flex gap-2">
          <MainButton fullWidth colorScheme="secondary" onPress={onCancel}>
            {t("localSetup.nodePackUpdate.cancel")}
          </MainButton>
          <MainButton fullWidth colorScheme="primary" onPress={onConfirm}>
            {t("localSetup.nodePackUpdate.confirm")}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
