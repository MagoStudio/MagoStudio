import type { ComfyProgressMonitor } from "./ComfyProgressMonitor";
import { COMFY_SAFETY_POLL_INTERVAL_MS } from "./comfySafetyPoll";

type ComfyPromptOutcome =
  | { state: "queued" | "running" }
  | { state: "finished" }
  | { state: "error"; message: string };

export const readComfyPromptWithSafetyPoll = async <
  TResult extends ComfyPromptOutcome
>({
  monitor,
  promptId,
  lastStatusCheckAt,
  readOverHttp
}: {
  monitor: Pick<
    ComfyProgressMonitor,
    "livePrompt" | "resetConnection" | "forget"
  >;
  promptId: string;
  lastStatusCheckAt: number;
  readOverHttp: () => Promise<TResult>;
}): Promise<{
  result: TResult | { state: "queued" | "running" };
  statusCheckedAt: number | null;
}> => {
  const livePrompt = monitor.livePrompt(promptId);
  const isStillRunningOnLiveSocket =
    livePrompt !== null && livePrompt.phase !== "settled";
  const isSafetyPollDue =
    Date.now() - lastStatusCheckAt >= COMFY_SAFETY_POLL_INTERVAL_MS;
  if (isStillRunningOnLiveSocket && !isSafetyPollDue)
    return {
      result: { state: livePrompt.phase === "running" ? "running" : "queued" },
      statusCheckedAt: null
    };
  const statusCheckedAt = Date.now();
  const result = await readOverHttp();
  const isPromptOver = result.state === "finished" || result.state === "error";
  if (isPromptOver) {
    const didSocketMissTheEnd = isStillRunningOnLiveSocket;
    if (didSocketMissTheEnd) monitor.resetConnection();
    monitor.forget(promptId);
  }
  return { result, statusCheckedAt };
};
