import { Img2ImgType } from "../schemas";
import { NANOBANANA_2_RESOLUTION_COST } from "../schemas/nanobanana2.schema";

import { ModelAdapter, RELAXED_MODE_MODEL_RESTRICTION_KEY } from "./types";

type Nanobanana2Data = Extract<Img2ImgType, { model: "nanobanana_2" }>;

export const nanobanana2Adapter: ModelAdapter<Nanobanana2Data> = {
  buildSettings: (data) => ({ resolution: data.resolution }),
  computeCost: (data) => NANOBANANA_2_RESOLUTION_COST[data.resolution],
  availableInRelaxedMode: false,
  relaxedModeRestrictionKey: RELAXED_MODE_MODEL_RESTRICTION_KEY
};
