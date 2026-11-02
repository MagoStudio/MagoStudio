import type { ComfyLivePrompt } from "../comfy/ComfyProgressMonitor";

import { comfyProgressPercent } from "./comfyProgressPercent";
import { getRenderEta } from "./renderEta";

const MIN_PROGRESS_FRACTION_FOR_MEASURED_ETA = 0.05;
const MILLISECONDS_PER_SECOND = 1000;

export const comfyRenderEta = ({
  model,
  livePrompt,
  now = new Date()
}: {
  model: string;
  livePrompt: ComfyLivePrompt;
  now?: Date;
}): { ETA?: number; estimatedEndTime?: string; progress?: number } => {
  if (livePrompt.phase !== "running" || !livePrompt.runStartedAt) return {};
  const progressFraction = livePrompt.progressFraction;
  const hasEnoughProgressToMeasure =
    progressFraction >= MIN_PROGRESS_FRACTION_FOR_MEASURED_ETA;
  if (!hasEnoughProgressToMeasure)
    return getRenderEta({
      model,
      status: "INPROGRESS",
      startedAt: livePrompt.runStartedAt,
      now
    });
  const elapsedMs = Math.max(
    0,
    now.getTime() - livePrompt.runStartedAt.getTime()
  );
  const remainingMs = (elapsedMs * (1 - progressFraction)) / progressFraction;
  return {
    ETA: Math.max(0, Math.floor(remainingMs / MILLISECONDS_PER_SECOND)),
    estimatedEndTime: new Date(now.getTime() + remainingMs).toISOString(),
    progress: comfyProgressPercent(livePrompt)
  };
};
