import {
  LocalSetupWizardFlow,
  UNREADABLE_HARDWARE_REPORT
} from "./hooks/useLocalSetupWizardFlow";
import { LocalSetupDownloadStep } from "./LocalSetupDownloadStep";
import { LocalSetupHardwareStep } from "./LocalSetupHardwareStep";
import { LocalSetupLicensesStep } from "./LocalSetupLicensesStep";
import { LocalSetupModelsStep } from "./LocalSetupModelsStep";
import { LocalSetupStorageStep } from "./LocalSetupStorageStep";
import { LocalSetupWelcomeStep } from "./LocalSetupWelcomeStep";

export const LocalSetupWizardStep = ({
  flow,
  onClose,
  onCollapse,
  onUseCloud,
  onUseExistingComfy
}: {
  flow: LocalSetupWizardFlow;
  onClose: () => void;
  onCollapse: () => void;
  onUseCloud: () => void;
  onUseExistingComfy: () => void;
}) => {
  const { state } = flow;

  if (state.step === "welcome") {
    return (
      <LocalSetupWelcomeStep
        onStart={flow.startHardwareCheck}
        onUseExistingComfy={onUseExistingComfy}
      />
    );
  }

  if (state.step === "hardware") {
    return (
      <LocalSetupHardwareStep
        outcome={state.outcome}
        report={state.report ?? UNREADABLE_HARDWARE_REPORT}
        onContinue={flow.continueToModels}
        onUseCloud={onUseCloud}
      />
    );
  }

  if (state.step === "models") {
    return (
      <LocalSetupModelsStep
        modelGroups={flow.modelGroups}
        isLoading={flow.isModelGroupsStatusLoading}
        isPending={flow.modelsPending}
        error={flow.modelsError}
        onToggleModelGroup={flow.toggleModelGroup}
        onContinue={() => void flow.continueFromModels()}
      />
    );
  }

  if (state.step === "storage") {
    return (
      <LocalSetupStorageStep
        outcome={state.outcome}
        drives={flow.drives}
        isPending={flow.storagePending}
        error={flow.storageError}
        onRefresh={flow.refreshStorage}
        requiredGigabytes={flow.requiredGigabytes}
        selectedDriveId={state.selectedDriveId}
        onSelectDrive={flow.selectDrive}
        onContinue={flow.startDownload}
        onChooseAnotherDrive={flow.chooseAnotherDrive}
        onChooseInstallFolder={flow.chooseInstallFolder}
      />
    );
  }

  if (state.step === "licenses") {
    return (
      <LocalSetupLicensesStep
        licenses={state.licensesAwaitingAcceptance}
        isPending={flow.licensesPending}
        error={flow.licensesError}
        onAccept={() => void flow.acceptModelLicensesAndStartDownload()}
      />
    );
  }

  if (state.step === "download") {
    return (
      <LocalSetupDownloadStep
        status={flow.installer}
        error={flow.installerError}
        onPause={flow.pauseDownload}
        onResume={flow.resumeDownload}
        onCancel={flow.cancelDownload}
        onExplore={onCollapse}
        onFinish={onClose}
      />
    );
  }

  return null;
};
