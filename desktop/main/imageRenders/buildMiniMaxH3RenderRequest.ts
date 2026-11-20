import {
  doesMiniMaxH3VfxModeTakeSourceAudio,
  isMiniMaxH3VfxEditedFrameProvided,
  resolveMiniMaxH3CrossviewCamera,
  resolveMiniMaxH3VfxLoraStrength,
  resolveMiniMaxH3VfxMode
} from "../../shared/minimaxH3VfxModes";

import {
  type MiniMaxH3RenderRequest,
  resolveMiniMaxH3Quality
} from "./comfyMiniMaxH3Client";

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
}): MiniMaxH3RenderRequest => {
  const vfxMode = resolveMiniMaxH3VfxMode(settings.vfx_mode);
  return {
    prompt: typeof settings.prompt === "string" ? settings.prompt : "",
    width: Number(settings.width),
    height: Number(settings.height),
    durationSeconds,
    quality: resolveMiniMaxH3Quality(settings.h3_quality),
    referenceImagePaths,
    referenceVideoPath: sourceVideoPath,
    useReferenceVideoAudio:
      doesMiniMaxH3VfxModeTakeSourceAudio(vfxMode) &&
      settings.use_video_audio !== false &&
      doesSourceVideoHaveAudio,
    seed: typeof settings.seed === "number" ? settings.seed : undefined,
    vfxMode,
    isEditedFrameProvided: isMiniMaxH3VfxEditedFrameProvided(settings),
    vfxLoraStrength: resolveMiniMaxH3VfxLoraStrength(settings),
    crossviewCamera: resolveMiniMaxH3CrossviewCamera(settings)
  };
};
