import { isCloudAccountActive } from "./cloudAccount";
import { RenderProvider } from "./modelProviders";

/** Per-install visibility preferences for local rendering and Mago Cloud. */

export const STORAGE_KEY = "mago.providerPreferences";

export type ProviderPreferences = Record<RenderProvider, boolean>;

export const DEFAULT_PROVIDER_PREFERENCES: ProviderPreferences = {
  "local-comfy": true,
  "mago-cloud": true
};

const isProviderPreferences = (
  value: unknown
): value is Partial<ProviderPreferences> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const parseProviderPreferences = (
  raw: string | null
): ProviderPreferences => {
  if (!raw) return { ...DEFAULT_PROVIDER_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isProviderPreferences(parsed)) {
      return { ...DEFAULT_PROVIDER_PREFERENCES };
    }
    // Unknown or missing keys keep their default, so adding a provider later
    // does not silently switch it off for existing installs.
    const preferences: ProviderPreferences = {
      "local-comfy":
        typeof parsed["local-comfy"] === "boolean"
          ? parsed["local-comfy"]
          : DEFAULT_PROVIDER_PREFERENCES["local-comfy"],
      "mago-cloud":
        typeof parsed["mago-cloud"] === "boolean"
          ? parsed["mago-cloud"]
          : DEFAULT_PROVIDER_PREFERENCES["mago-cloud"]
    };
    // Old installs could have only the removed fal provider enabled.
    if (!Object.values(preferences).some(Boolean))
      preferences["local-comfy"] = true;
    return preferences;
  } catch {
    return { ...DEFAULT_PROVIDER_PREFERENCES };
  }
};

export const readSavedProviderPreferences = (): ProviderPreferences => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PROVIDER_PREFERENCES };
  }
  try {
    return parseProviderPreferences(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing, or storage disabled: defaults are fine.
    return { ...DEFAULT_PROVIDER_PREFERENCES };
  }
};

export const readProviderPreferences = (): ProviderPreferences => {
  return {
    "local-comfy": true,
    "mago-cloud": isCloudAccountActive()
  };
};

export const writeProviderPreferences = (
  preferences: ProviderPreferences
): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    // So other views update without a reload.
    window.dispatchEvent(new CustomEvent(PROVIDER_PREFERENCES_EVENT));
  } catch {
    // Nothing useful to do if it cannot be persisted.
  }
};

export const PROVIDER_PREFERENCES_EVENT = "mago:provider-preferences";

/**
 * Turning every provider off would leave an empty model list, which is never
 * what the user meant, so the last one on cannot be switched off.
 */
export const canDisableProvider = (
  preferences: ProviderPreferences,
  provider: RenderProvider
): boolean =>
  !preferences[provider] ||
  Object.values(preferences).filter(Boolean).length > 1;
