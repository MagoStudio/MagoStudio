import {
  providersForImageModel,
  providersForVideoModel,
  RenderProvider
} from "./modelProviders";
import {
  ProviderPreferences,
  readProviderPreferences
} from "./providerPreferences";

/** Execution location stays fixed even when its provider is unavailable. */
export type RenderTarget = "local" | "cloud";

export const resolveRenderProvider = (
  model: string | undefined,
  cloudAvailable: boolean = isCloudRenderAvailable(),
  enabled: ProviderPreferences = readProviderPreferences()
): RenderProvider | null => {
  const providers = providersForVideoModel(model);
  if (
    cloudAvailable &&
    enabled["mago-cloud"] &&
    providers.includes("mago-cloud")
  ) {
    return "mago-cloud";
  }
  return (
    providers.find(
      (provider) => provider !== "mago-cloud" && enabled[provider]
    ) ?? null
  );
};

export const videoRenderTarget = (
  model: string | undefined,
  _cloudAvailable: boolean = isCloudRenderAvailable(),
  _enabled?: ProviderPreferences
): RenderTarget =>
  providersForVideoModel(model).includes("mago-cloud") ? "cloud" : "local";

export const resolveImageRenderProvider = (
  model: string | undefined,
  cloudAvailable: boolean = isCloudRenderAvailable(),
  enabled: ProviderPreferences = readProviderPreferences()
): RenderProvider | null => {
  const providers = providersForImageModel(model);
  if (
    cloudAvailable &&
    enabled["mago-cloud"] &&
    providers.includes("mago-cloud")
  ) {
    return "mago-cloud";
  }
  return (
    providers.find(
      (provider) => provider !== "mago-cloud" && enabled[provider]
    ) ?? null
  );
};

export const imageRenderTarget = (
  model: string | undefined,
  _cloudAvailable: boolean = isCloudRenderAvailable(),
  _enabled?: ProviderPreferences
): RenderTarget =>
  providersForImageModel(model).includes("mago-cloud") ? "cloud" : "local";

export const CLOUD_SUBMISSION_FROM_DESKTOP = true;

export const isCloudRenderAvailable = (): boolean => {
  if (typeof window === "undefined") return true;
  if (!window.mago) return true;
  return CLOUD_SUBMISSION_FROM_DESKTOP && window.mago.account?.mode === "cloud";
};

export const cloudUnavailableReason = ():
  | "signed-out"
  | "not-implemented"
  | null => {
  if (isCloudRenderAvailable()) return null;
  if (typeof window === "undefined" || !window.mago) return null;
  return window.mago.account?.mode === "cloud"
    ? "not-implemented"
    : "signed-out";
};

export const isRenderTargetAvailable = (
  target: RenderTarget,
  cloudAvailable: boolean = isCloudRenderAvailable()
): boolean => target === "local" || cloudAvailable;

export const isVideoModelAvailable = (
  model: string | undefined,
  cloudAvailable: boolean = isCloudRenderAvailable(),
  enabled?: ProviderPreferences
): boolean => resolveRenderProvider(model, cloudAvailable, enabled) !== null;

export const isImageModelAvailable = (
  model: string | undefined,
  cloudAvailable: boolean = isCloudRenderAvailable(),
  enabled?: ProviderPreferences
): boolean =>
  resolveImageRenderProvider(model, cloudAvailable, enabled) !== null;
