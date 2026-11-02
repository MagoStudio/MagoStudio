import { describe, expect, it } from "vitest";

import { isModelAllowedInRelaxedMode } from "./isModelAllowedInRelaxedMode";

describe("isModelAllowedInRelaxedMode", () => {
  it("allows a video engine_version present in the whitelist", () => {
    expect(
      isModelAllowedInRelaxedMode(
        ["v5.0.0", "kling_o1", "gpt_image_2"],
        "v5.0.0"
      )
    ).toBe(true);
  });

  it("blocks a video engine_version not in the whitelist", () => {
    expect(
      isModelAllowedInRelaxedMode(["v5.0.0", "gpt_image_2"], "kling_o1")
    ).toBe(false);
  });

  it("allows an img2img render_model present in the whitelist", () => {
    expect(
      isModelAllowedInRelaxedMode(["v5.0.0", "gpt_image_2"], "gpt_image_2")
    ).toBe(true);
  });

  it("blocks an img2img render_model not in the whitelist", () => {
    expect(isModelAllowedInRelaxedMode(["gpt_image_2"], "kontext")).toBe(false);
  });

  it("blocks every model when the whitelist is empty (fail closed)", () => {
    expect(isModelAllowedInRelaxedMode([], "v5.0.0")).toBe(false);
    expect(isModelAllowedInRelaxedMode([], "gpt_image_2")).toBe(false);
  });

  it("matches identifiers case-sensitively", () => {
    expect(isModelAllowedInRelaxedMode(["v5.0.0"], "V5.0.0")).toBe(false);
    expect(isModelAllowedInRelaxedMode(["gpt_image_2"], "GPT_IMAGE_2")).toBe(
      false
    );
  });
});
