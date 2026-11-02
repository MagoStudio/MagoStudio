import { SheetRenderModel } from "../constants";

/** Mirrors the backend's per-image prices. Every reference
 * sheet is one image, and each model tiers that price by the run's `output_size` — which is what
 * the sheet render is submitted at, so the tier is knowable here.
 *
 * Verified against the backend on 2026-09-09. */

/** 1536 x 1536. */
const SEEDREAM_5_PRO_T2I_LOW_TIER_MAX_PIXELS = 2359296;
const SEEDREAM_5_PRO_T2I_LOW_TIER_CREDITS = 60;
const SEEDREAM_5_PRO_T2I_HIGH_TIER_CREDITS = 120;

/** The backend defaults an absent `quality` to `high`, not `medium`, so that its estimate can
 * never undercharge what fal renders. The sheet request sends no quality, so `high` is the tier
 * actually billed and therefore the one to quote. */
/** 2560 x 1440. */
const GPT_IMAGE_2_T2I_STANDARD_TIER_MAX_PIXELS = 3686400;
const GPT_IMAGE_2_T2I_STANDARD_TIER_CREDITS_AT_HIGH_QUALITY = 190;
const GPT_IMAGE_2_T2I_LARGE_TIER_CREDITS_AT_HIGH_QUALITY = 344;

/** This model takes a size class rather than pixels, and the backend snaps the long edge to
 * whichever of these edges is closest — so the boundaries sit at the midpoints between them,
 * not at the edges themselves. */
const NANOBANANA_2_T2I_CREDITS_BY_RESOLUTION_EDGE = [
  { edgePx: 512, credits: 92 },
  { edgePx: 1024, credits: 122 },
  { edgePx: 2048, credits: 183 },
  { edgePx: 4096, credits: 243 }
] as const;

const estimateNanobanana2T2iCredits = (longEdgePx: number): number =>
  NANOBANANA_2_T2I_CREDITS_BY_RESOLUTION_EDGE.reduce((closest, candidate) =>
    Math.abs(candidate.edgePx - longEdgePx) <
    Math.abs(closest.edgePx - longEdgePx)
      ? candidate
      : closest
  ).credits;

export const estimateSheetImageCredits = (
  renderModel: SheetRenderModel,
  outputSize: [number, number]
): number => {
  const [widthPx, heightPx] = outputSize;
  const totalPixels = widthPx * heightPx;

  if (renderModel === "seedream_5_pro_t2i") {
    return totalPixels <= SEEDREAM_5_PRO_T2I_LOW_TIER_MAX_PIXELS
      ? SEEDREAM_5_PRO_T2I_LOW_TIER_CREDITS
      : SEEDREAM_5_PRO_T2I_HIGH_TIER_CREDITS;
  }

  if (renderModel === "gpt_image_2_t2i") {
    return totalPixels <= GPT_IMAGE_2_T2I_STANDARD_TIER_MAX_PIXELS
      ? GPT_IMAGE_2_T2I_STANDARD_TIER_CREDITS_AT_HIGH_QUALITY
      : GPT_IMAGE_2_T2I_LARGE_TIER_CREDITS_AT_HIGH_QUALITY;
  }

  return estimateNanobanana2T2iCredits(Math.max(widthPx, heightPx));
};
