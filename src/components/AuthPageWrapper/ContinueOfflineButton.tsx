import { MainButton } from "@components/MainButton";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const ContinueOfflineButton = () => {
  const { t } = useTranslation();
  const [isSwitchingToOffline, setIsSwitchingToOffline] = useState(false);
  const isRunningInDesktopShell = Boolean(window.mago?.account);

  if (!isRunningInDesktopShell) return null;

  const continueOffline = () => {
    setIsSwitchingToOffline(true);
    void window.mago?.account
      ?.chooseMode("offline")
      .catch(() => setIsSwitchingToOffline(false));
  };

  return (
    <div className="flex justify-center">
      <MainButton
        size="sm"
        variant="outlined"
        colorScheme="onColor"
        loading={isSwitchingToOffline}
        isDisabled={isSwitchingToOffline}
        onPress={continueOffline}
        data-testid="auth-continue-offline"
      >
        {t("authPage.continueOffline", {
          defaultValue: "Skip and continue offline"
        })}
      </MainButton>
    </div>
  );
};
