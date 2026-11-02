import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ComfyStatus } from "../../../../../desktop/shared/contracts";
import { waitForComfyToRespond } from "../utils/waitForComfyToRespond";

export type ComfyLaunchAttempt =
  | {
      phase: "launching";
      startedAtMs: number;
      checkCount: number;
      lastCheckAtMs: number | null;
    }
  | { phase: "failed"; failureReason: "timed-out" }
  | {
      phase: "failed";
      failureReason: "launched-process-exited";
      exitCode: number | null;
      reportedFailureReason: string | null;
    }
  | { phase: "failed"; failureReason: "launch-error"; errorMessage: string };

const startingAttempt = (startedAtMs: number): ComfyLaunchAttempt => ({
  phase: "launching",
  startedAtMs,
  checkCount: 0,
  lastCheckAtMs: null
});

export const useComfyLaunchAttempt = ({
  onComfyResponded
}: {
  onComfyResponded: (comfyStatus: ComfyStatus) => void;
}) => {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState<ComfyLaunchAttempt>(() =>
    startingAttempt(Date.now())
  );
  const currentAttemptCancellation = useRef<AbortController | null>(null);

  const cancel = () => currentAttemptCancellation.current?.abort();

  const start = async ({
    restartUnresponsiveProcess = false
  }: { restartUnresponsiveProcess?: boolean } = {}) => {
    cancel();
    const cancellation = new AbortController();
    currentAttemptCancellation.current = cancellation;
    const launchStartedAtMs = Date.now();
    setAttempt(startingAttempt(launchStartedAtMs));
    try {
      await window.mago.comfy.launch({ restartUnresponsiveProcess });
      if (cancellation.signal.aborted) return;
      const waitOutcome = await waitForComfyToRespond({
        checkComfyStatus: () => window.mago.comfy.check(),
        launchStartedAtMs,
        signal: cancellation.signal,
        onCheck: (checkCount) =>
          setAttempt((previous) =>
            previous.phase === "launching"
              ? { ...previous, checkCount, lastCheckAtMs: Date.now() }
              : previous
          )
      });
      if (waitOutcome.outcome === "cancelled") return;
      if (waitOutcome.outcome === "launched-process-exited") {
        setAttempt({
          phase: "failed",
          failureReason: "launched-process-exited",
          exitCode: waitOutcome.exitCode,
          reportedFailureReason: waitOutcome.reportedFailureReason
        });
        return;
      }
      if (waitOutcome.outcome === "timed-out") {
        setAttempt({ phase: "failed", failureReason: "timed-out" });
        return;
      }
      onComfyResponded(waitOutcome.comfyStatus);
    } catch (err) {
      if (cancellation.signal.aborted) return;
      setAttempt({
        phase: "failed",
        failureReason: "launch-error",
        errorMessage:
          err instanceof Error && err.message
            ? err.message
            : t("localSetup.comfyLaunch.dialog.launchErrorFallback")
      });
    }
  };

  return { attempt, start, cancel };
};
