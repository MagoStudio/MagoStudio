import { VideoEngine } from "@models/video/types";

export const MAGO_NATIVE_VIDEO_CREDIT_DISCOUNT = 0.3;

export const DISCOUNTED_MAGO_ENGINES: ReadonlySet<VideoEngine> = new Set([
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0,
  VideoEngine.V5_1_0,
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler,
  VideoEngine.v1_0_0_mask,
  VideoEngine.minimax_reference
]);

export function applyMagoCreditDiscount(
  credits: number,
  engine: VideoEngine
): number {
  if (!DISCOUNTED_MAGO_ENGINES.has(engine)) return Math.ceil(credits);
  return Math.ceil(credits * (1 - MAGO_NATIVE_VIDEO_CREDIT_DISCOUNT));
}
