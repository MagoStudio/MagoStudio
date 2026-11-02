import type { LocalImageModelName } from "../../desktop/shared/contracts";

const LOCAL_IMAGE_MODELS = [
  "gpt_image_2",
  "seedream_5_pro",
  "qwen",
  "nanobanana_pro",
  "nanobanana_2"
] as const satisfies readonly LocalImageModelName[];

export type LocalImageModel = (typeof LOCAL_IMAGE_MODELS)[number];

export const isLocalImageModel = (
  model: string | undefined
): model is LocalImageModel =>
  LOCAL_IMAGE_MODELS.some((candidate) => candidate === model);

/** Only Qwen runs locally. Other catalog entries are rendered by Mago Cloud. */
const COMFY_LOCAL_IMAGE_MODELS = [
  "qwen"
] as const satisfies readonly LocalImageModel[];

export const isComfyLocalImageModel = (
  model: string | undefined
): model is (typeof COMFY_LOCAL_IMAGE_MODELS)[number] =>
  COMFY_LOCAL_IMAGE_MODELS.some((candidate) => candidate === model);
