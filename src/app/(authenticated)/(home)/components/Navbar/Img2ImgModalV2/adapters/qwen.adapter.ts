import { Img2ImgType } from "../schemas";

import { ModelAdapter } from "./types";

type QwenData = Extract<Img2ImgType, { model: "qwen" }>;

export const qwenAdapter: ModelAdapter<QwenData> = {
  buildSettings: () => ({}),
  computeCost: (data) => data.generationCost,
  availableInRelaxedMode: false
};
