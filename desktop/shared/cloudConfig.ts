import { readFileSync } from "node:fs";
import path from "node:path";

import defaults from "./cloud.json";

/**
 * Cloud Mago endpoints, resolved once and shared by the main process and the
 * renderer build. `cloud.json` holds the production values; every field can be
 * overridden by environment variable so a developer can point a build at dev or
 * staging without editing tracked files.
 *
 * None of these are secrets. A Clerk publishable key and an API base URL are
 * both shipped in the public web bundle already.
 */

export interface CloudConfig {
  /** Host the renderer is served from. Must be a subdomain of the Clerk primary domain. */
  rendererHost: string;
  clerkPublishableKey: string;
  backendUrl: string;
  mediaHosts: string[];
  /**
   * Hosts the app window may navigate to in place, beyond its own origin.
   *
   * Sign-in redirects through Clerk's frontend API and then through the OAuth
   * provider, and that has to happen in the window because the resulting session
   * cookie must land in the app's cookie jar, not the browser's. Everything not
   * listed here opens in the user's real browser instead. Enabling a new OAuth
   * provider in Clerk means adding its host.
   */
  signInNavigationHosts: string[];
  cloudStatusUrl: string;
  cloudStorageHosts: string[];
  voicePreviewSources: string[];
}

/** Clerk keys are base64 of the frontend API host with a trailing `$`. */
export const clerkFrontendApiHost = (publishableKey: string): string | null => {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, "");
  if (encoded === publishableKey) return null;
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const host = decoded.replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? host : null;
  } catch {
    return null;
  }
};

/**
 * What the renderer bundle was actually built with.
 *
 * The renderer bakes its Clerk key and backend URL in at build time; the main
 * process builds the CSP that must allow them. Reading this file first makes
 * disagreement impossible -- without it, a build pointed at staging served a CSP
 * that only allowed production Clerk, so clerk-js was blocked and the app merely
 * reported that it could not reach the cloud.
 */
export const readGeneratedCloudConfig = (
  directory: string = __dirname
): Partial<CloudConfig> => {
  try {
    const contents = readFileSync(
      path.join(directory, "cloud.generated.json"),
      "utf8"
    );
    const parsed = JSON.parse(contents) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Partial<CloudConfig>)
      : {};
  } catch {
    // No generated file: a fresh checkout, or a build that never ran.
    return {};
  }
};

export const resolveCloudConfig = (
  environment: Record<string, string | undefined> = process.env,
  generatedDirectory?: string
): CloudConfig => {
  const built = readGeneratedCloudConfig(generatedDirectory);
  return {
    rendererHost:
      built.rendererHost ||
      environment.MAGO_RENDERER_HOST ||
      defaults.rendererHost,
    clerkPublishableKey:
      built.clerkPublishableKey ||
      environment.MAGO_CLERK_PUBLISHABLE_KEY ||
      defaults.clerkPublishableKey,
    backendUrl:
      built.backendUrl || environment.MAGO_BACKEND_URL || defaults.backendUrl,
    mediaHosts: built.mediaHosts ?? defaults.mediaHosts,
    signInNavigationHosts:
      built.signInNavigationHosts ?? defaults.signInNavigationHosts,
    cloudStatusUrl: built.cloudStatusUrl ?? defaults.cloudStatusUrl,
    cloudStorageHosts:
      built.cloudStorageHosts ??
      environment.MAGO_CLOUD_STORAGE_HOSTS?.split(",") ??
      defaults.cloudStorageHosts,
    voicePreviewSources:
      built.voicePreviewSources ?? defaults.voicePreviewSources
  };
};

/** Hosts the app window may navigate to in place: its own, plus the sign-in chain. */
export const inWindowNavigationHosts = (config: CloudConfig): string[] => {
  const frontendApi = clerkFrontendApiHost(config.clerkPublishableKey);
  return [
    config.rendererHost,
    ...(frontendApi ? [frontendApi] : []),
    ...config.signInNavigationHosts
  ];
};

const originOf = (url: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

/** Origins the renderer is allowed to reach, derived from the resolved config. */
export const cloudOrigins = (
  config: CloudConfig
): {
  clerk: string | null;
  backend: string | null;
  cloudStatus: string | null;
  media: string[];
  voicePreviewAudio: string[];
} => {
  const frontendApi = clerkFrontendApiHost(config.clerkPublishableKey);
  let backend: string | null = null;
  try {
    backend = config.backendUrl ? new URL(config.backendUrl).origin : null;
  } catch {
    backend = null;
  }
  return {
    clerk: frontendApi ? `https://${frontendApi}` : null,
    backend,
    cloudStatus: originOf(config.cloudStatusUrl),
    media: config.mediaHosts,
    voicePreviewAudio: backend
      ? [
          ...config.cloudStorageHosts.map((host) => `https://${host}`),
          ...config.voicePreviewSources
        ]
      : []
  };
};
