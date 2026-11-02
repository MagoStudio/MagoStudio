import { useLocalSetupDebugSetting } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { useTranslation } from "react-i18next";

import { LocalSetupWizardFlow } from "./hooks/useLocalSetupWizardFlow";
import { LocalSetupExistingComfyDialog } from "./LocalSetupExistingComfyDialog";
import { LocalSetupWizardHeader } from "./LocalSetupWizardHeader";
import { LocalSetupWizardStep } from "./LocalSetupWizardStep";

const stepNumberByStep = {
  welcome: 1,
  hardware: 2,
  models: 3,
  storage: 4,
  licenses: 5,
  download: 6
} as const;

export const LocalSetupWizard = ({
  flow,
  onClose,
  onUseCloud,
  onCollapse,
  isExistingComfyDialogOpen,
  onOpenExistingComfyDialog,
  onCloseExistingComfyDialog
}: {
  flow: LocalSetupWizardFlow;
  onClose: () => void;
  onUseCloud: () => void;
  onCollapse: () => void;
  isExistingComfyDialogOpen: boolean;
  onOpenExistingComfyDialog: () => void;
  onCloseExistingComfyDialog: () => void;
}) => {
  const { t } = useTranslation();
  const [isLocalSetupDebugEnabled] = useLocalSetupDebugSetting();
  const isBackAvailable =
    isLocalSetupDebugEnabled && flow.state.step !== "welcome";

  const stepNames = [
    t("localSetup.steps.welcome", { defaultValue: "Welcome" }),
    t("localSetup.steps.hardware", { defaultValue: "Hardware check" }),
    t("localSetup.steps.models", { defaultValue: "Models" }),
    t("localSetup.steps.storage", { defaultValue: "Storage" }),
    t("localSetup.steps.licenses", { defaultValue: "Licenses" }),
    t("localSetup.steps.download", { defaultValue: "Download" })
  ];

  return (
    <div className="flex w-[420px] flex-col gap-3 overflow-hidden rounded-xl bg-surface-bg-100 p-4 shadow-glassmorphism backdrop-blur-[10px]">
      <LocalSetupWizardHeader
        stepNames={stepNames}
        stepNumber={stepNumberByStep[flow.state.step]}
        onCollapse={onCollapse}
        onSkipStep={isLocalSetupDebugEnabled ? flow.skipToNextStep : undefined}
        skipStepLabel={t(
          flow.doesSkipStartFakeDownload
            ? "localSetup.skipToFakeDownload"
            : "localSetup.skipStep"
        )}
        onBack={isBackAvailable ? flow.goBack : undefined}
        isBackDisabled={!flow.canGoBack}
      />

      <LocalSetupWizardStep
        flow={flow}
        onClose={onClose}
        onCollapse={onCollapse}
        onUseCloud={onUseCloud}
        onUseExistingComfy={onOpenExistingComfyDialog}
      />

      <LocalSetupExistingComfyDialog
        isOpen={isExistingComfyDialogOpen}
        onClose={onCloseExistingComfyDialog}
        onComplete={() => {
          onCloseExistingComfyDialog();
          onClose();
        }}
      />
    </div>
  );
};
