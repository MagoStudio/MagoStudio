import { describe, expect, it } from "vitest";

import { SHEET_RENDER_MODELS } from "../constants";

import { isSheetRenderModel } from "./isSheetRenderModel";

describe("isSheetRenderModel", () => {
  it.each(SHEET_RENDER_MODELS)("accepts %s", (model) => {
    expect(isSheetRenderModel(model)).toBe(true);
  });

  it("rejects the image-to-image sibling of a text-to-image model", () => {
    expect(isSheetRenderModel("img2img_seedream_5_pro_t2i")).toBe(false);
  });

  it("rejects anything that is not one of the models", () => {
    expect(isSheetRenderModel("gpt_image_1_t2i")).toBe(false);
    expect(isSheetRenderModel(undefined)).toBe(false);
    expect(isSheetRenderModel(null)).toBe(false);
    expect(isSheetRenderModel(1)).toBe(false);
    expect(isSheetRenderModel({ model: "seedream_5_pro_t2i" })).toBe(false);
  });
});
