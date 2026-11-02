import { describe, expect, it, vi } from "vitest";

import {
  canDisableProvider,
  DEFAULT_PROVIDER_PREFERENCES,
  parseProviderPreferences,
  readProviderPreferences,
  ProviderPreferences
} from "./providerPreferences";

describe("parseProviderPreferences", () => {
  it("uses sign-in and ignores the retired cloud switch", () => {
    const account = { mode: "offline" };
    let saved = JSON.stringify({ "mago-cloud": true });
    vi.stubGlobal("window", {
      mago: { account },
      localStorage: { getItem: () => saved }
    });
    try {
      expect(readProviderPreferences()["mago-cloud"]).toBe(false);
      account.mode = "cloud";
      expect(readProviderPreferences()["mago-cloud"]).toBe(true);
      saved = JSON.stringify({ "mago-cloud": false });
      expect(readProviderPreferences()["mago-cloud"]).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("keeps local models available after signing out of a cloud-only setup", () => {
    const account = { mode: "offline" };
    vi.stubGlobal("window", {
      mago: { account },
      localStorage: {
        getItem: () =>
          JSON.stringify({ "local-comfy": false, "mago-cloud": true })
      }
    });
    try {
      expect(readProviderPreferences()).toEqual({
        "local-comfy": true,
        "mago-cloud": false
      });
      account.mode = "cloud";
      expect(readProviderPreferences()).toEqual({
        "local-comfy": true,
        "mago-cloud": true
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("has every provider on by default", () => {
    expect(parseProviderPreferences(null)).toEqual({
      "local-comfy": true,
      "mago-cloud": true
    });
  });

  it("reads a stored choice back", () => {
    expect(
      parseProviderPreferences(JSON.stringify({ "mago-cloud": false }))
    ).toEqual({
      "local-comfy": true,
      "mago-cloud": false
    });
  });

  it("keeps a provider it has never heard of at its default", () => {
    // Adding a provider later must not silently switch it off for existing
    // installs whose stored value predates it.
    const stored = JSON.stringify({ "local-fal": false });

    expect(parseProviderPreferences(stored)).toEqual({
      "local-comfy": true,
      "mago-cloud": true
    });
  });

  it("recovers installs with only the removed fal provider enabled", () => {
    expect(
      parseProviderPreferences(
        JSON.stringify({
          "local-fal": true,
          "local-comfy": false,
          "mago-cloud": false
        })
      )
    ).toEqual({ "local-comfy": true, "mago-cloud": false });
  });

  it("ignores values of the wrong type", () => {
    expect(
      parseProviderPreferences(JSON.stringify({ "mago-cloud": "no" }))
    ).toEqual(DEFAULT_PROVIDER_PREFERENCES);
  });

  it("falls back to defaults for corrupt or unexpected storage", () => {
    for (const stored of ["{ not json", "[]", '"a string"', "null", ""]) {
      expect(parseProviderPreferences(stored)).toEqual(
        DEFAULT_PROVIDER_PREFERENCES
      );
    }
  });
});

describe("canDisableProvider", () => {
  const all: ProviderPreferences = {
    "local-comfy": true,
    "mago-cloud": true
  };

  it("allows switching one off while others remain", () => {
    expect(canDisableProvider(all, "mago-cloud")).toBe(true);
  });

  it("refuses to switch off the last one, which would empty the model list", () => {
    const onlyCloud: ProviderPreferences = {
      "local-comfy": false,
      "mago-cloud": true
    };

    expect(canDisableProvider(onlyCloud, "mago-cloud")).toBe(false);
  });

  it("always allows switching one back on", () => {
    const onlyCloud: ProviderPreferences = {
      "local-comfy": false,
      "mago-cloud": true
    };

    expect(canDisableProvider(onlyCloud, "local-comfy")).toBe(true);
  });
});
