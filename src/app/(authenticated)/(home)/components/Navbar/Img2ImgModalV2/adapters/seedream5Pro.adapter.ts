import { Img2ImgType } from "../schemas";

import { ModelAdapter } from "./types";

type Seedream5ProData = Extract<Img2ImgType, { model: "seedream_5_pro" }>;

export const seedream5ProAdapter: ModelAdapter<Seedream5ProData> = {
  buildSettings: () => ({ num_images: 1 }),
  computeCost: (data) => data.generationCost,
  availableInRelaxedMode: false
};
