import { ComfyLaunchProgress } from "@app/components/ComfyLaunchDialog/ComfyLaunchProgress";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { useLaunchComfy } from "./hooks/useLaunchComfy";

export const LaunchComfyButton = () => {
  const { t } = useTranslation();
  const { status, launch, launchProgress } = useLaunchComfy();
  if (status.data?.available) return null;
  if (!status.data?.canLaunch) return null;
  return (
    <div className="flex flex-col gap-2">
      <MainButton
        size="sm"
        colorScheme="primary"
        isDisabled={status.isPending || launch.isPending}
        loading={launch.isPending}
        onPress={() => launch.mutate()}
        data-testid="launch-comfyui"
      >
        {t(
          launch.isPending
            ? "localSetup.comfyLaunch.launching"
            : "localSetup.comfyLaunch.label"
        )}
      </MainButton>
      {launch.isPending && launchProgress && (
        <div
          className="flex flex-col gap-1.5"
          data-testid="launch-comfyui-progress"
        >
          <Text variant="xs" color="glyph-secondary">
            {t("localSetup.comfyLaunch.dialog.launchingDescription")}
          </Text>
          <ComfyLaunchProgress {...launchProgress} />
        </div>
      )}
      {status.data.launchPath && (
        <Text
          variant="xs"
          color="glyph-secondary"
          className="select-text break-all"
        >
          {status.data.launchPath}
        </Text>
      )}
      {(launch.error || status.error) && (
        <Text variant="xs" color="glyph-error">
          {(launch.error ?? status.error)?.message}
        </Text>
      )}
    </div>
  );
};
