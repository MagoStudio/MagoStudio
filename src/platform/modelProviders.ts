import { isComfyLocalImageModel } from "./localImageModels";
import { isComfyLocalVideoModel } from "./localVideoModels";

/** Models run locally through ComfyUI or through Mago Cloud, including its fal.ai integrations. */

export type RenderProvider = "local-comfy" | "mago-cloud";

/** For badges. Short, because it sits next to a model name. */
export const PROVIDER_LABEL: Record<RenderProvider, string> = {
  "local-comfy": "Local",
  "mago-cloud": "Mago cloud"
};

export const providersForVideoModel = (
  model: string | undefined
): RenderProvider[] => {
  if (isComfyLocalVideoModel(model)) return ["local-comfy"];
  // Mago's own engines, and anything unrecognised, only exist in the cloud.
  return ["mago-cloud"];
};

/** Image models use the same two providers. */
export const providersForImageModel = (
  model: string | undefined
): RenderProvider[] => {
  if (isComfyLocalImageModel(model)) return ["local-comfy"];
  return ["mago-cloud"];
};

export const supportsProvider = (
  model: string | undefined,
  provider: RenderProvider
): boolean => providersForVideoModel(model).includes(provider);

/** True for the models a signed-in user can run without a fal key of their own. */
export const runsOnMagoCredits = (model: string | undefined): boolean =>
  supportsProvider(model, "mago-cloud");
