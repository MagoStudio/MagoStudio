import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  clerkFrontendApiHost,
  cloudOrigins,
  readGeneratedCloudConfig,
  resolveCloudConfig
} from "./cloudConfig";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const withGenerated = async (contents: unknown) => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-config-"));
  directories.push(directory);
  await writeFile(
    path.join(directory, "cloud.generated.json"),
    typeof contents === "string" ? contents : JSON.stringify(contents)
  );
  return directory;
};

const DEV_KEY = "pk_test_ZGVjaWRpbmctYm94ZXItMzUuY2xlcmsuYWNjb3VudHMuZGV2JA";
const LIVE_KEY = "pk_live_Y2xlcmsuYXBwLm1hZ28uc3R1ZGlvJA";

describe("clerkFrontendApiHost", () => {
  it("derives the frontend API host from a publishable key", () => {
    expect(clerkFrontendApiHost(DEV_KEY)).toBe(
      "deciding-boxer-35.clerk.accounts.dev"
    );
    expect(clerkFrontendApiHost(LIVE_KEY)).toBe("clerk.app.mago.studio");
  });

  it("returns null for something that is not a publishable key", () => {
    expect(clerkFrontendApiHost("")).toBeNull();
    expect(clerkFrontendApiHost("not-a-key")).toBeNull();
  });
});

describe("resolveCloudConfig", () => {
  it("prefers what the bundle was built with over the environment", async () => {
    // The bug this prevents: a build pointed at staging while the main process
    // read production defaults, so the CSP blocked clerk-js and the app only
    // reported that it could not reach the cloud.
    const directory = await withGenerated({
      clerkPublishableKey: DEV_KEY,
      backendUrl: "https://staging.app.mago.studio/api/v02"
    });

    const config = resolveCloudConfig(
      { MAGO_CLERK_PUBLISHABLE_KEY: LIVE_KEY },
      directory
    );

    expect(config.clerkPublishableKey).toBe(DEV_KEY);
    expect(config.backendUrl).toBe("https://staging.app.mago.studio/api/v02");
  });

  it("falls back to the environment when nothing was generated", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-empty-"));
    directories.push(directory);

    const config = resolveCloudConfig(
      {
        MAGO_CLERK_PUBLISHABLE_KEY: DEV_KEY,
        MAGO_BACKEND_URL: "https://staging.app.mago.studio/api/v02"
      },
      directory
    );

    expect(config.clerkPublishableKey).toBe(DEV_KEY);
  });

  it("falls back to the committed defaults when neither is present", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-empty-"));
    directories.push(directory);

    const config = resolveCloudConfig({}, directory);

    expect(config.clerkPublishableKey).toBe(LIVE_KEY);
    expect(config.rendererHost).toBe("desktop.app.mago.studio");
    expect(config.signInNavigationHosts).toContain("accounts.google.com");
    expect(config.cloudStorageHosts).toEqual([
      "mago-s3-prod.s3.eu-north-1.amazonaws.com",
      "mago-s3-prod.s3.amazonaws.com"
    ]);
  });

  it("takes cloud storage hosts from the environment when nothing was generated", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-empty-"));
    directories.push(directory);

    const config = resolveCloudConfig(
      {
        MAGO_CLOUD_STORAGE_HOSTS:
          "mago-s3-test.s3.eu-north-1.amazonaws.com,mago-s3-test.s3.amazonaws.com"
      },
      directory
    );

    expect(config.cloudStorageHosts).toEqual([
      "mago-s3-test.s3.eu-north-1.amazonaws.com",
      "mago-s3-test.s3.amazonaws.com"
    ]);
  });

  it("ignores a corrupt generated file rather than failing to start", async () => {
    const directory = await withGenerated("{ not json");

    expect(resolveCloudConfig({}, directory).clerkPublishableKey).toBe(
      LIVE_KEY
    );
  });

  it("takes only the fields the generated file actually carries", async () => {
    const directory = await withGenerated({ backendUrl: "https://x/api/v02" });

    const config = resolveCloudConfig({}, directory);

    expect(config.backendUrl).toBe("https://x/api/v02");
    expect(config.clerkPublishableKey).toBe(LIVE_KEY);
  });
});

describe("readGeneratedCloudConfig", () => {
  it("returns nothing for a directory with no generated file", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-none-"));
    directories.push(directory);

    expect(readGeneratedCloudConfig(directory)).toEqual({});
  });
});

describe("cloudOrigins", () => {
  it("derives the origins the CSP has to allow", () => {
    const origins = cloudOrigins(resolveCloudConfig({}, tmpdir()));

    expect(origins.clerk).toBe("https://clerk.app.mago.studio");
    expect(origins.backend).toBe("https://app.mago.studio");
    expect(origins.cloudStatus).toBe(
      "https://mago-state-25qdhq4f4q-uc.a.run.app"
    );
  });

  it("reports no remote origins when no cloud is configured", () => {
    const origins = cloudOrigins({
      rendererHost: "desktop.app.mago.studio",
      clerkPublishableKey: "",
      backendUrl: "",
      mediaHosts: [],
      signInNavigationHosts: [],
      cloudStatusUrl: "",
      cloudStorageHosts: []
    });

    expect(origins.clerk).toBeNull();
    expect(origins.backend).toBeNull();
    expect(origins.cloudStatus).toBeNull();
  });
});
