import type { ComfyLaunchProgressState } from "@app/components/ComfyLaunchDialog/ComfyLaunchProgress";
import { waitForComfyToRespond } from "@app/components/ComfyLaunchDialog/utils/waitForComfyToRespond";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  COMFY_LAUNCH_STATUS_QUERY_KEY,
  useComfyLaunchStatus
} from "./useComfyLaunchStatus";

export const COMFY_LAUNCH_MUTATION_KEY = ["comfy-launch"];

export const useLaunchComfy = () => {
  const client = useQueryClient();
  const { t } = useTranslation();
  const status = useComfyLaunchStatus();
  const [launchProgress, setLaunchProgress] =
    useState<ComfyLaunchProgressState | null>(null);
  const launch = useMutation({
    mutationKey: COMFY_LAUNCH_MUTATION_KEY,
    mutationFn: async () => {
      const launchStartedAtMs = Date.now();
      setLaunchProgress({
        startedAtMs: launchStartedAtMs,
        checkCount: 0,
        lastCheckAtMs: null
      });
      await window.mago.comfy.launch();
      const waitOutcome = await waitForComfyToRespond({
        checkComfyStatus: () => window.mago.comfy.check(),
        launchStartedAtMs,
        onCheck: (checkCount) =>
          setLaunchProgress({
            startedAtMs: launchStartedAtMs,
            checkCount,
            lastCheckAtMs: Date.now()
          })
      });
      if (waitOutcome.outcome === "launched-process-exited")
        throw new Error(
          [
            t("localSetup.comfyLaunch.launchedProcessExited", {
              exitCode:
                waitOutcome.exitCode ??
                t("localSetup.comfyLaunch.unknownExitCode")
            }),
            waitOutcome.reportedFailureReason &&
              t("localSetup.comfyLaunch.reportedFailureReason", {
                reason: waitOutcome.reportedFailureReason
              })
          ]
            .filter(Boolean)
            .join(" ")
        );
      if (waitOutcome.outcome !== "responded")
        throw new Error(t("localSetup.comfyLaunch.timeout"));
      client.setQueryData(
        COMFY_LAUNCH_STATUS_QUERY_KEY,
        waitOutcome.comfyStatus
      );
    }
  });
  return { status, launch, launchProgress };
};
