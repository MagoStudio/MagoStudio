import { resolveMiniMaxH3QualitySteps } from "../../shared/minimaxH3StepLoras";
import {
  isMiniMaxH3VfxEditedFrameProvided,
  resolveMiniMaxH3VfxLoraStrength,
  resolveMiniMaxH3VfxMode
} from "../../shared/minimaxH3VfxModes";

import type { MiniMaxH3RenderRequest } from "./comfyMiniMaxH3Client";

export const buildMiniMaxH3RenderRequest = ({
  settings,
  durationSeconds,
  referenceImagePaths,
  sourceVideoPath,
  doesSourceVideoHaveAudio
}: {
  settings: Record<string, unknown>;
  durationSeconds: number;
  referenceImagePaths: string[];
  sourceVideoPath: string;
  doesSourceVideoHaveAudio: boolean;
}): MiniMaxH3RenderRequest => ({
  prompt: typeof settings.prompt === "string" ? settings.prompt : "",
  width: Number(settings.width),
  height: Number(settings.height),
  durationSeconds,
  steps: resolveMiniMaxH3QualitySteps(settings.h3_quality),
  referenceImagePaths,
  referenceVideoPath: sourceVideoPath,
  useReferenceVideoAudio:
    settings.use_video_audio !== false && doesSourceVideoHaveAudio,
  seed: typeof settings.seed === "number" ? settings.seed : undefined,
  vfxMode: resolveMiniMaxH3VfxMode(settings.vfx_mode),
  isEditedFrameProvided: isMiniMaxH3VfxEditedFrameProvided(settings),
  vfxLoraStrength: resolveMiniMaxH3VfxLoraStrength(settings)
});
