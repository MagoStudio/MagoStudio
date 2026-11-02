import type { ComfyLivePrompt } from "../comfy/ComfyProgressMonitor";

const MAX_ACTIVE_PROGRESS = 99;
const PERCENT_MULTIPLIER = 100;

export const comfyProgressPercent = (livePrompt: ComfyLivePrompt): number =>
  Math.min(
    MAX_ACTIVE_PROGRESS,
    livePrompt.progressFraction * PERCENT_MULTIPLIER
  );
