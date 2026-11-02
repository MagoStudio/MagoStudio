import { getAdapter } from "@home/components/Navbar/Img2ImgModalV2/adapters";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { NANOBANANA_PRO_COST } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobananaPro.schema";

const DEFAULT_IMG2IMG_COST = 40;

export const PLAN_IMG2IMG_DEFAULT_COST = DEFAULT_IMG2IMG_COST;
export const PLAN_IMG2IMG_NANOBANANA_PRO_COST = NANOBANANA_PRO_COST;

/**
 * Delegates to the same per-model adapters the live Generate flow uses, so
 * Plan-flow estimates can't drift from the real cost (the old flat/hardcoded
 * copy here fell out of sync with the schema defaults).
 * Falls back to the flat default for a legacy/removed model value that may
 * still be present in an old saved Plan.
 */
export function getImg2ImgCost(values: Img2ImgType): number {
  const adapter = getAdapter(values);
  return adapter
    ? Math.ceil(adapter.computeCost(values))
    : DEFAULT_IMG2IMG_COST;
}
