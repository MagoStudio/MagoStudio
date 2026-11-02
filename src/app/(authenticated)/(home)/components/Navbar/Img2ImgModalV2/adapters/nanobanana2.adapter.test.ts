import { describe, expect, it } from "vitest";

import { Img2ImgType } from "../schemas";

import { nanobanana2Adapter } from "./nanobanana2.adapter";

type Nanobanana2Data = Extract<Img2ImgType, { model: "nanobanana_2" }>;

const baseData = {
  model: "nanobanana_2",
  frameType: "video",
  prompt: "test",
  referenceImages: [],
  resolution: "2K"
} as unknown as Nanobanana2Data;

describe("nanobanana2Adapter.buildSettings", () => {
  it("forwards the resolution the estimate charges for", () => {
    const settings = nanobanana2Adapter.buildSettings({
      ...baseData,
      resolution: "4K"
    } as Nanobanana2Data);

    expect(settings.resolution).toBe("4K");
  });
});
