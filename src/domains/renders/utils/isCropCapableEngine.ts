import { VideoEngine } from "@models/video/types";

import { RenderProvider } from "@/platform/modelProviders";
import { resolveRenderProvider } from "@/platform/renderTarget";

const ENGINES_CROPPED_BY_MAGO_CLOUD = new Set<string>([
  VideoEngine.V2_5_0,
  VideoEngine.V3_1_0,
  VideoEngine.V3_2_0,
  VideoEngine.V3_3_0,
  VideoEngine.V3_3_0_CNETS,
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0,
  VideoEngine.V5_1_0,
  VideoEngine.V7_0_0,
  VideoEngine.V8_0_0,
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler,
  VideoEngine.v1_0_0_mask
]);

const ENGINES_CROPPED_ONLY_WHEN_RENDERED_LOCALLY = new Set<string>([
  VideoEngine.wan_animate_2_2,
  VideoEngine.wan_vace_2_1,
  VideoEngine.mago_style_transfer_local,
  VideoEngine.mago_animate
]);

export const isCropCapableEngine = (
  engine: VideoEngine | string | undefined,
  renderProvider: RenderProvider | null = resolveRenderProvider(engine)
): boolean => {
  if (!engine) return false;
  if (ENGINES_CROPPED_BY_MAGO_CLOUD.has(engine)) return true;
  const isRenderSentToMagoCloud = renderProvider === "mago-cloud";
  return (
    !isRenderSentToMagoCloud &&
    ENGINES_CROPPED_ONLY_WHEN_RENDERED_LOCALLY.has(engine)
  );
};
