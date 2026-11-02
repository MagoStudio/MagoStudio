import { Img2ImgSettings } from "@models/img2img/types";

import { Img2ImgType } from "../schemas";

export const RELAXED_MODE_MODEL_RESTRICTION_KEY =
  "notifications.payment_flow_relaxed_mode_model_restriction.description";

export interface ModelAdapter<T extends Img2ImgType> {
  buildSettings(data: T): Partial<Img2ImgSettings>;
  computeCost(data: T): number;
  availableInRelaxedMode: boolean;
  relaxedModeRestrictionKey?: typeof RELAXED_MODE_MODEL_RESTRICTION_KEY;
}
