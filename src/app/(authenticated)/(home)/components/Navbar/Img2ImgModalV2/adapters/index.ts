import { Img2ImgType } from "../schemas";

import { gptImage2Adapter } from "./gptImage2.adapter";
import { nanobanana2Adapter } from "./nanobanana2.adapter";
import { nanobananaProAdapter } from "./nanobananaPro.adapter";
import { qwenAdapter } from "./qwen.adapter";
import { seedream5ProAdapter } from "./seedream5Pro.adapter";
import { ModelAdapter } from "./types";

export const modelAdapters = {
  seedream_5_pro: seedream5ProAdapter,
  nanobanana_2: nanobanana2Adapter,
  nanobanana_pro: nanobananaProAdapter,
  qwen: qwenAdapter,
  gpt_image_2: gptImage2Adapter
} satisfies {
  [M in Img2ImgType["model"]]: ModelAdapter<Extract<Img2ImgType, { model: M }>>;
};

export const getAdapter = <D extends Img2ImgType>(data: D): ModelAdapter<D> =>
  modelAdapters[data.model] as ModelAdapter<D>;
