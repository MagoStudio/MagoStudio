import { CREDITS_PER_SECOND } from "@config/constants";
import { VideoEngine } from "@models/video/types";
import { applyMagoCreditDiscount } from "@utils/magoCreditDiscount";

export function calcMagoNativeRenderCredits(
  engine: VideoEngine,
  renderTimeSeconds: number
): number {
  return applyMagoCreditDiscount(
    renderTimeSeconds * CREDITS_PER_SECOND,
    engine
  );
}
