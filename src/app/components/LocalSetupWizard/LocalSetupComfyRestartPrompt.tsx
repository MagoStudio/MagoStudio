import { ComfyLaunchProgress } from "@app/components/ComfyLaunchDialog/ComfyLaunchProgress";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { useRestartComfy } from "./hooks/useRestartComfy";

export const LocalSetupComfyRestartPrompt = ({
  onRestarted
}: {
  onRestarted?: () => void;
}) => {
  const { t } = useTranslation();
  const { restartStatus, restart, restartProgress } = useRestartComfy({
    onRestarted
  });
  const runningOrQueuedRenderCount =
    restartStatus.data?.runningOrQueuedRenderCount ?? 0;
  const isComfyBusy = runningOrQueuedRenderCount > 0;

  if (restart.isSuccess)
    return (
      <Text variant="sm" color="success">
        {t("localSetup.comfyRestart.restarted")}
      </Text>
    );

  const hasRestartStarted = restart.isPending || restart.isError;

  if (!hasRestartStarted) {
    if (restartStatus.isPending) return null;

    if (restartStatus.isError)
      return (
        <Text variant="sm" color="glyph-warning">
          {t("localSetup.comfyRestart.restartStatusUnknown")}
        </Text>
      );

    if (restartStatus.data.restartMethod === null)
      return (
        <Text variant="sm" color="glyph-warning">
          {t("localSetup.comfyRestart.restartYourself")}
        </Text>
      );
  }

  return (
    <div className="flex flex-col gap-2">
      <Text variant="xs" color="glyph-secondary">
        {t("localSetup.comfyRestart.description")}
      </Text>
      {isComfyBusy && !restart.isPending && (
        <Text variant="xs" color="glyph-warning">
          {t("localSetup.comfyRestart.busyWarning", {
            count: runningOrQueuedRenderCount
          })}
        </Text>
      )}
      <MainButton
        size="sm"
        colorScheme={isComfyBusy ? "secondary" : "primary"}
        loading={restart.isPending}
        isDisabled={restart.isPending}
        onPress={() => restart.mutate()}
      >
        {t(
          restart.isPending
            ? "localSetup.comfyRestart.restarting"
            : isComfyBusy
              ? "localSetup.comfyRestart.restartAnyway"
              : "localSetup.comfyRestart.restart"
        )}
      </MainButton>
      {restart.isPending && restartProgress && (
        <ComfyLaunchProgress {...restartProgress} />
      )}
      {restart.isError && (
        <Text variant="xs" color="glyph-error">
          {restart.error.message}
        </Text>
      )}
    </div>
  );
};
