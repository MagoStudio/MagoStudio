import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotImageSettingOverrides } from "./buildBulkRenderingDraftShotImageSettingOverrides";

describe("buildBulkRenderingDraftShotImageSettingOverrides", () => {
  it("emits an override for a Shot with a touched setting", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingOverrides({
      imageSettingByShotId: { "shot-1": { quality: "high" } }
    });

    expect(overrides).toEqual({ "shot-1": { quality: "high" } });
  });

  it("omits a Shot whose patch is empty", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingOverrides({
      imageSettingByShotId: { "shot-1": {} }
    });

    expect(overrides).toEqual({});
  });

  it("keeps Shots independent of each other", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingOverrides({
      imageSettingByShotId: {
        "shot-1": { resolution: "4K" },
        "shot-2": {}
      }
    });

    expect(Object.keys(overrides)).toEqual(["shot-1"]);
  });

  it("returns an empty record when nothing was touched", () => {
    const overrides = buildBulkRenderingDraftShotImageSettingOverrides({
      imageSettingByShotId: {}
    });

    expect(overrides).toEqual({});
  });
});
