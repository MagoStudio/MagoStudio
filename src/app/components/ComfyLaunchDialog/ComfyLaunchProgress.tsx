import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { useCurrentTimeMs } from "./hooks/useCurrentTimeMs";
import { formatMinutesAndSeconds } from "./utils/formatMinutesAndSeconds";
import {
  COMFY_LAUNCH_CHECK_INTERVAL_MS,
  COMFY_LAUNCH_TIMEOUT_MS
} from "./utils/waitForComfyToRespond";

const MILLISECONDS_PER_SECOND = 1000;

export type ComfyLaunchProgressState = {
  startedAtMs: number;
  checkCount: number;
  lastCheckAtMs: number | null;
};

export const ComfyLaunchProgress = ({
  startedAtMs,
  checkCount,
  lastCheckAtMs
}: ComfyLaunchProgressState) => {
  const { t } = useTranslation();
  const currentTimeMs = useCurrentTimeMs(true);
  const elapsedSinceLaunchMs = Math.min(
    Math.max(0, currentTimeMs - startedAtMs),
    COMFY_LAUNCH_TIMEOUT_MS
  );
  return (
    <div className="flex flex-col gap-1.5">
      <LinearProgress
        value={elapsedSinceLaunchMs}
        totalValue={COMFY_LAUNCH_TIMEOUT_MS}
        aria-label={t("localSetup.comfyLaunch.dialog.launchingTitle")}
      />
      <div className="flex justify-between gap-3">
        <Text variant="xs" color="glyph-tertiary">
          {lastCheckAtMs === null
            ? t("localSetup.comfyLaunch.dialog.startingProcess")
            : t("localSetup.comfyLaunch.dialog.checkProgress", {
                count: checkCount,
                seconds: Math.max(
                  1,
                  Math.ceil(
                    (lastCheckAtMs +
                      COMFY_LAUNCH_CHECK_INTERVAL_MS -
                      currentTimeMs) /
                      MILLISECONDS_PER_SECOND
                  )
                )
              })}
        </Text>
        <Text variant="xs" color="glyph-tertiary">
          {t("localSetup.comfyLaunch.dialog.elapsed", {
            elapsed: formatMinutesAndSeconds(elapsedSinceLaunchMs),
            limit: formatMinutesAndSeconds(COMFY_LAUNCH_TIMEOUT_MS)
          })}
        </Text>
      </div>
    </div>
  );
};
