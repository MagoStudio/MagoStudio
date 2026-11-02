import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CloudUnavailableNoticeProps {
  message: string;
  detail?: string;
  onRetry?: () => void;
  "data-testid"?: string;
}

export const CloudUnavailableNotice = ({
  message,
  detail,
  onRetry,
  "data-testid": dataTestId
}: CloudUnavailableNoticeProps) => {
  const { t } = useTranslation();
  const [isSwitchingToOffline, setIsSwitchingToOffline] = useState(false);

  const continueOffline = () => {
    setIsSwitchingToOffline(true);
    void window.mago?.account
      ?.chooseMode("offline")
      .catch(() => setIsSwitchingToOffline(false));
  };

  return (
    <div
      data-testid={dataTestId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="flex w-[420px] flex-col items-center gap-6 rounded-3xl bg-surface-primary p-8 text-glyph-primary">
        <img alt="Mago" src="/logo.svg" className="w-[180px]" />

        <Text component="p" variant="sm" color="glyph-secondary" align="center">
          {message}{" "}
          {t("cloudUnreachable.offlineIsFine", {
            defaultValue:
              "You can work offline — your library and projects are on this computer and stay fully available."
          })}
        </Text>

        {detail && (
          <Text
            component="p"
            variant="xs"
            color="glyph-tertiary"
            align="center"
          >
            {detail}
          </Text>
        )}

        <div className="flex w-full flex-col gap-3">
          {onRetry && (
            <MainButton
              fullWidth
              colorScheme="primary"
              isDisabled={isSwitchingToOffline}
              onPress={onRetry}
            >
              {t("cloudUnreachable.retry", { defaultValue: "Try again" })}
            </MainButton>
          )}

          <MainButton
            fullWidth
            variant="outlined"
            colorScheme="onColor"
            loading={isSwitchingToOffline}
            isDisabled={isSwitchingToOffline}
            onPress={continueOffline}
          >
            {t("cloudUnreachable.continueOffline", {
              defaultValue: "Work offline"
            })}
          </MainButton>
        </div>
      </div>
    </div>
  );
};
