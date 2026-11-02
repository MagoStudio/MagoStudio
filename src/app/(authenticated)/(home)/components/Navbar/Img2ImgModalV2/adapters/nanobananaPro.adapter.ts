import { Img2ImgType } from "../schemas";

import { ModelAdapter, RELAXED_MODE_MODEL_RESTRICTION_KEY } from "./types";

type NanobananaProData = Extract<Img2ImgType, { model: "nanobanana_pro" }>;

export const nanobananaProAdapter: ModelAdapter<NanobananaProData> = {
  buildSettings: () => ({}),
  computeCost: (data) => data.generationCost,
  availableInRelaxedMode: false,
  relaxedModeRestrictionKey: RELAXED_MODE_MODEL_RESTRICTION_KEY
};
