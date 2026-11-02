import { MainButton } from "@components/MainButton";
import { Tooltip } from "@components/Tooltip";
import { useTranslation } from "react-i18next";

import { useLocalSetupOpenRequest } from "./hooks/useLocalSetupOpenRequest";
import { useOpenLocalSetupWizard } from "./hooks/useOpenLocalSetupWizard";
import { LocalSetupWarningTooltip } from "./LocalSetupWarningTooltip";
import type { RequiredLocalInstall } from "./requiredLocalInstall";

export const SetupMagoStudioButton = ({
  onOpen,
  requiredLocalInstall,
  lockedRenderButton
}: {
  onOpen?: () => void;
  requiredLocalInstall?: RequiredLocalInstall;
  lockedRenderButton?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const openLocalSetupWizard = useOpenLocalSetupWizard();
  const { isUpdatingInstallation, resolveOpenRequest } =
    useLocalSetupOpenRequest(requiredLocalInstall);
  const openSetup = () => {
    onOpen?.();
    if (!isUpdatingInstallation) openLocalSetupWizard();
    else void resolveOpenRequest().then(openLocalSetupWizard);
  };

  if (isUpdatingInstallation && lockedRenderButton)
    return (
      <LocalSetupWarningTooltip
        placement="bottom"
        message={t("localSetup.updateInstallation.tooltip")}
        actionLabel={t("localSetup.updateInstallation.label")}
        onAction={openSetup}
      >
        {lockedRenderButton}
      </LocalSetupWarningTooltip>
    );

  return (
    <Tooltip
      isVisible
      placement="top"
      textContent={t(
        isUpdatingInstallation
          ? "localSetup.updateInstallation.tooltip"
          : "localSetup.setupMagoStudio.tooltip"
      )}
      trigger={
        <MainButton fullWidth colorScheme="primary" onPress={openSetup}>
          {t(
            isUpdatingInstallation
              ? "localSetup.updateInstallation.label"
              : "localSetup.setupMagoStudio.label"
          )}
        </MainButton>
      }
    />
  );
};
