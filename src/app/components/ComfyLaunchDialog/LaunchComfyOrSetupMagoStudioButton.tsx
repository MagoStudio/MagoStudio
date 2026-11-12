import { LocalSetupWarningTooltip } from "@app/components/LocalSetupWizard/LocalSetupWarningTooltip";
import type { RequiredLocalInstall } from "@app/components/LocalSetupWizard/requiredLocalInstall";
import { SetupMagoStudioButton } from "@app/components/LocalSetupWizard/SetupMagoStudioButton";
import { MainButton } from "@components/MainButton";
import { Tooltip } from "@components/Tooltip";
import { comfyLaunchDialogOpenAtom } from "@store/atoms/comfyLaunchDialogOpenAtom";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useShouldOfferComfyLaunch } from "./hooks/useShouldOfferComfyLaunch";

export const LaunchComfyOrSetupMagoStudioButton = ({
  onSetup,
  onBeforeOpenComfyLaunch,
  requiredLocalInstall,
  lockedRenderButton
}: {
  onSetup?: () => void;
  onBeforeOpenComfyLaunch?: () => Promise<boolean>;
  requiredLocalInstall?: RequiredLocalInstall;
  lockedRenderButton?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const [isComfyLaunchDialogOpen, setComfyLaunchDialogOpen] = useAtom(
    comfyLaunchDialogOpenAtom
  );
  const { shouldOfferComfyLaunch } = useShouldOfferComfyLaunch();
  if (!shouldOfferComfyLaunch)
    return (
      <SetupMagoStudioButton
        onOpen={onSetup}
        requiredLocalInstall={requiredLocalInstall}
        lockedRenderButton={lockedRenderButton}
      />
    );

  const openComfyLaunchDialog = async () => {
    const isReadyToLaunch = (await onBeforeOpenComfyLaunch?.()) ?? true;
    if (isReadyToLaunch) setComfyLaunchDialogOpen(true);
  };

  if (lockedRenderButton)
    return (
      <LocalSetupWarningTooltip
        isVisible={!isComfyLaunchDialogOpen}
        placement="bottom"
        message={t("localSetup.comfyLaunch.tooltip")}
        actionLabel={t("localSetup.comfyLaunch.label")}
        onAction={() => void openComfyLaunchDialog()}
      >
        {lockedRenderButton}
      </LocalSetupWarningTooltip>
    );

  return (
    <Tooltip
      isVisible={!isComfyLaunchDialogOpen}
      placement="top"
      textContent={t("localSetup.comfyLaunch.tooltip")}
      trigger={
        <MainButton
          fullWidth
          colorScheme="primary"
          onPress={() => void openComfyLaunchDialog()}
          data-testid="open-comfy-launch-dialog"
        >
          {t("localSetup.comfyLaunch.label")}
        </MainButton>
      }
    />
  );
};
