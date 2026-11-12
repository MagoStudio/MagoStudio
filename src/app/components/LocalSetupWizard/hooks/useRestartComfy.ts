import type { ComfyLaunchProgressState } from "@app/components/ComfyLaunchDialog/ComfyLaunchProgress";
import { waitForComfyToRespond } from "@app/components/ComfyLaunchDialog/utils/waitForComfyToRespond";
import { COMFY_LAUNCH_STATUS_QUERY_KEY } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { refreshModelSettings } from "../utils/refreshModelSettings";

const RESTART_STATUS_REFETCH_MS = 3000;
const SETUP_STATUS_QUERY_KEYS_REFRESHED_AFTER_RESTART = [
  ["local-script-setup"],
  ["local-video-setup"],
  ["comfy-restart-status"]
];

export const useRestartComfy = ({
  onRestarted
}: {
  onRestarted?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [restartProgress, setRestartProgress] =
    useState<ComfyLaunchProgressState | null>(null);
  const restartStatus = useQuery({
    queryKey: ["comfy-restart-status"],
    queryFn: () => window.mago.comfy.restartStatus(),
    retry: false,
    refetchInterval: RESTART_STATUS_REFETCH_MS
  });
  const restart = useMutation({
    mutationFn: async () => {
      const restartStartedAtMs = Date.now();
      setRestartProgress({
        startedAtMs: restartStartedAtMs,
        checkCount: 0,
        lastCheckAtMs: null
      });
      await window.mago.comfy.restart();
      const waitOutcome = await waitForComfyToRespond({
        checkComfyStatus: () => window.mago.comfy.check(),
        launchStartedAtMs: restartStartedAtMs,
        onCheck: (checkCount) =>
          setRestartProgress({
            startedAtMs: restartStartedAtMs,
            checkCount,
            lastCheckAtMs: Date.now()
          })
      });
      if (waitOutcome.outcome === "launched-process-exited")
        throw new Error(
          t("localSetup.comfyLaunch.launchedProcessExited", {
            exitCode:
              waitOutcome.exitCode ??
              t("localSetup.comfyLaunch.unknownExitCode")
          })
        );
      if (waitOutcome.outcome !== "responded")
        throw new Error(t("localSetup.comfyLaunch.timeout"));
      queryClient.setQueryData(
        COMFY_LAUNCH_STATUS_QUERY_KEY,
        waitOutcome.comfyStatus
      );
    },
    onSuccess: async () => {
      await refreshModelSettings(queryClient);
      await Promise.all(
        SETUP_STATUS_QUERY_KEYS_REFRESHED_AFTER_RESTART.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
      onRestarted?.();
    }
  });
  return { restartStatus, restart, restartProgress };
};
