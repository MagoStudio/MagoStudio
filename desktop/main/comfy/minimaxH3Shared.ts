const DIMENSION_ALIGNMENT_PX = 32;
const MIN_DIMENSION_PX = 256;
const MAX_DIMENSION_PX = 1920;
const FPS = 24;
const MIN_LENGTH_FRAMES = 5;
const MAX_LENGTH_FRAMES = 362;
const LENGTH_FRAME_STRIDE = 17;

export const MINIMAX_H3_SHARED_MODEL_FILES = {
  unet: "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
  textEncoderVanilla: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
  videoVae: "minimax_h3_video_vae_fp16.safetensors",
  audioVae: "minimax_h3_audio_vae_fp32.safetensors",
  pddAccelerator: "MiniMax-H3-Ref2VA-Acc-8Step.safetensors",
  fourStepLora: "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors"
} as const;

export const clampMiniMaxH3Dimension = (value: number): number =>
  Math.max(
    MIN_DIMENSION_PX,
    Math.min(
      MAX_DIMENSION_PX,
      Math.round(value / DIMENSION_ALIGNMENT_PX) * DIMENSION_ALIGNMENT_PX
    )
  );

export const snapMiniMaxH3LengthFrames = (durationSeconds: number): number => {
  const rawFrames = Math.round(durationSeconds * FPS);
  const snappedFrames =
    MIN_LENGTH_FRAMES +
    Math.round((rawFrames - MIN_LENGTH_FRAMES) / LENGTH_FRAME_STRIDE) *
      LENGTH_FRAME_STRIDE;
  return Math.max(
    MIN_LENGTH_FRAMES,
    Math.min(MAX_LENGTH_FRAMES, snappedFrames)
  );
};
