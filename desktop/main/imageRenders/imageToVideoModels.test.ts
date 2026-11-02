import { describe, expect, it } from "vitest";

import {
  isLocalImageToVideoModelName,
  resolveImageToVideoResolution
} from "./imageToVideoModels";

describe("isLocalImageToVideoModelName", () => {
  it("recognises both Seedance Image-to-Video tiers", () => {
    expect(isLocalImageToVideoModelName("seedance_2_i2v")).toBe(true);
    expect(isLocalImageToVideoModelName("seedance_2_i2v_fast")).toBe(true);
  });

  it("rejects models that render from a source video", () => {
    expect(isLocalImageToVideoModelName("seedance_2")).toBe(false);
    expect(isLocalImageToVideoModelName("kling_o1")).toBe(false);
    expect(isLocalImageToVideoModelName("toString")).toBe(false);
  });
});

describe("resolveImageToVideoResolution", () => {
  it("keeps a resolution the tier supports", () => {
    expect(resolveImageToVideoResolution("seedance_2_i2v", "4k")).toBe("4k");
    expect(resolveImageToVideoResolution("seedance_2_i2v_fast", "480p")).toBe(
      "480p"
    );
  });

  it("falls back to 720p for a resolution the tier does not offer", () => {
    expect(resolveImageToVideoResolution("seedance_2_i2v_fast", "1080p")).toBe(
      "720p"
    );
    expect(resolveImageToVideoResolution("seedance_2_i2v", undefined)).toBe(
      "720p"
    );
  });
});
