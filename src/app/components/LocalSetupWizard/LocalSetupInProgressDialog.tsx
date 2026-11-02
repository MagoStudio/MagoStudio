import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { localSetupBlockedDialogOpenAtom } from "@store/atoms/localSetupBlockedDialogOpenAtom";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

/**
 * Shown when a render is attempted while the local models are still arriving.
 *
 * Connecting to cloud clears the stored mode and rebuilds the window, which is
 * the only route back to the sign-in screen; the download does not survive it.
 */

export const LocalSetupInProgressDialog = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useAtom(localSetupBlockedDialogOpenAtom);

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      width="sm"
      title={t("localSetupBlocked.title", {
        defaultValue: "Your local setup is still running"
      })}
    >
      <div className="flex flex-col gap-5">
        <Text variant="sm" color="glyph-secondary">
          {t("localSetupBlocked.description", {
            defaultValue:
              "The models for local rendering are still downloading, so this render cannot run on your graphics card yet. You can connect the cloud version and render there in the meantime."
          })}
        </Text>

        <div className="flex gap-2">
          <MainButton
            fullWidth
            colorScheme="secondary"
            onPress={() => setIsOpen(false)}
          >
            {t("localSetupBlocked.keepWaiting", {
              defaultValue: "Keep waiting"
            })}
          </MainButton>

          <MainButton
            fullWidth
            colorScheme="primary"
            onPress={() => void window.mago?.account?.signOut()}
          >
            {t("localSetupBlocked.connectCloud", {
              defaultValue: "Connect Mago cloud"
            })}
          </MainButton>
        </div>
      </div>
    </Modal>
  );
};
