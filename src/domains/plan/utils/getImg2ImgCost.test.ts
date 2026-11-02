import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import {
  getImg2ImgCost,
  PLAN_IMG2IMG_DEFAULT_COST,
  PLAN_IMG2IMG_NANOBANANA_PRO_COST
} from "./getImg2ImgCost";

describe("getImg2ImgCost", () => {
  it("returns the nanobanana pro cost for the nanobanana_pro model", () => {
    expect(
      getImg2ImgCost({
        model: "nanobanana_pro",
        generationCost: PLAN_IMG2IMG_NANOBANANA_PRO_COST
      } as Img2ImgType)
    ).toBe(PLAN_IMG2IMG_NANOBANANA_PRO_COST);
  });

  it("returns the quality-tiered cost for gpt_image_2", () => {
    expect(
      getImg2ImgCost({ model: "gpt_image_2", quality: "high" } as Img2ImgType)
    ).toBe(190);
    expect(
      getImg2ImgCost({
        model: "gpt_image_2",
        quality: "medium"
      } as Img2ImgType)
    ).toBe(50);
  });

  it("returns the resolution-tiered cost for nanobanana_2", () => {
    expect(
      getImg2ImgCost({
        model: "nanobanana_2",
        resolution: "4K"
      } as Img2ImgType)
    ).toBe(243);
    expect(
      getImg2ImgCost({
        model: "nanobanana_2",
        resolution: "0.5K"
      } as Img2ImgType)
    ).toBe(92);
  });

  it("returns the flat cost for seedream_5_pro", () => {
    expect(
      getImg2ImgCost({
        model: "seedream_5_pro",
        generationCost: 120
      } as Img2ImgType)
    ).toBe(120);
  });

  it("returns the flat cost for qwen", () => {
    expect(
      getImg2ImgCost({ model: "qwen", generationCost: 77 } as Img2ImgType)
    ).toBe(77);
  });

  it("falls back to the default cost for unrecognized models", () => {
    expect(
      getImg2ImgCost({ model: "some-unknown-model" } as unknown as Img2ImgType)
    ).toBe(PLAN_IMG2IMG_DEFAULT_COST);
  });

  it("falls back to the default cost for the legacy mago model (removed)", () => {
    expect(getImg2ImgCost({ model: "mago" } as unknown as Img2ImgType)).toBe(
      PLAN_IMG2IMG_DEFAULT_COST
    );
  });
});
