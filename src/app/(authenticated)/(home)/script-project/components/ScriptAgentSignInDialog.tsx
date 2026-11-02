import { useShouldOfferComfyLaunch } from "@app/components/ComfyLaunchDialog/hooks/useShouldOfferComfyLaunch";
import { useLocalSetupOpenRequest } from "@app/components/LocalSetupWizard/hooks/useLocalSetupOpenRequest";
import { useOpenLocalSetupWizard } from "@app/components/LocalSetupWizard/hooks/useOpenLocalSetupWizard";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { comfyLaunchDialogOpenAtom } from "@store/atoms/comfyLaunchDialogOpenAtom";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  isSignedIn: boolean;
  isCloudPending: boolean;
  cloudError: string | null;
  canSetUpLocally: boolean;
  onCancel: () => void;
  onUseCloud: () => void;
};

export const ScriptAgentSignInDialog: React.FC<Props> = ({
  isOpen,
  isSignedIn,
  isCloudPending,
  cloudError,
  canSetUpLocally,
  onCancel,
  onUseCloud
}) => {
  const { t } = useTranslation();
  const openLocalSetupWizard = useOpenLocalSetupWizard();
  const {
    isUpdatingInstallation: isUpdatingLocalLlmInstallation,
    resolveOpenRequest: resolveLocalLlmSetupOpenRequest
  } = useLocalSetupOpenRequest({
    kind: "model-group",
    modelGroupId: "local-llm"
  });
  const setComfyLaunchDialogOpen = useSetAtom(comfyLaunchDialogOpenAtom);
  const { shouldOfferComfyLaunch } = useShouldOfferComfyLaunch({
    isComfyLaunchStatusNeeded: isOpen
  });
  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen && !isCloudPending) onCancel();
      }}
      size={{ mode: "hug", maxWidthPx: 460 }}
    >
      <div
        className="flex w-full flex-col gap-6 p-6"
        data-testid="script-agent-sign-in-dialog"
      >
        <div className="flex flex-col gap-2">
          <Text component="h4" variant="lg" weight="semibold">
            {t("script_project.text_access_title.label")}
          </Text>
          <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
            {t(
              isSignedIn
                ? "script_project.text_access_enable_description.label"
                : "script_project.text_access_sign_in_description.label"
            )}
          </Text>
          {cloudError && (
            <div role="alert">
              <Text variant="sm" color="glyph-error">
                {cloudError}
              </Text>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <MainButton
            colorScheme="secondary"
            isDisabled={isCloudPending}
            onPress={onCancel}
          >
            {t("script_project.text_access_cancel.label")}
          </MainButton>
          {canSetUpLocally &&
            (shouldOfferComfyLaunch ? (
              <MainButton
                colorScheme="secondary"
                isDisabled={isCloudPending}
                onPress={() => {
                  onCancel();
                  setComfyLaunchDialogOpen(true);
                }}
              >
                {t("localSetup.comfyLaunch.label")}
              </MainButton>
            ) : (
              <MainButton
                colorScheme="secondary"
                isDisabled={isCloudPending}
                onPress={() => {
                  onCancel();
                  if (!isUpdatingLocalLlmInstallation) openLocalSetupWizard();
                  else
                    void resolveLocalLlmSetupOpenRequest().then(
                      openLocalSetupWizard
                    );
                }}
              >
                {t("script_project.text_access_local_setup.label")}
              </MainButton>
            ))}
          <MainButton
            colorScheme="primary"
            loading={isCloudPending}
            onPress={onUseCloud}
          >
            {t(
              isSignedIn
                ? "script_project.text_access_enable_cloud.label"
                : "script_project.text_access_sign_in.label"
            )}
          </MainButton>
        </div>
      </div>
    </OverlayDialog>
  );
};
