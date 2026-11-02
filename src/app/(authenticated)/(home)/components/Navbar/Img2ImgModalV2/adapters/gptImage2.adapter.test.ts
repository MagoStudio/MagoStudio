import { describe, expect, it } from "vitest";

import { Img2ImgType } from "../schemas";

import { gptImage2Adapter } from "./gptImage2.adapter";

type GptImage2Data = Extract<Img2ImgType, { model: "gpt_image_2" }>;

const baseData = {
  model: "gpt_image_2",
  frameType: "video",
  prompt: "test",
  referenceImages: [],
  quality: "medium",
  generationCost: 50
} as unknown as GptImage2Data;

describe("gptImage2Adapter.buildSettings", () => {
  it("always includes num_images: 1", () => {
    const settings = gptImage2Adapter.buildSettings(baseData);

    expect(settings.num_images).toBe(1);
  });

  it("forwards the quality the estimate charges for", () => {
    const settings = gptImage2Adapter.buildSettings({
      ...baseData,
      quality: "high"
    } as GptImage2Data);

    expect(settings.quality).toBe("high");
  });

  it("forwards mask_image_id when an uploaded mask image is present", () => {
    const settings = gptImage2Adapter.buildSettings({
      ...baseData,
      maskImages: ["mask-asset-1"]
    } as GptImage2Data);

    expect(settings.mask_image_id).toBe("mask-asset-1");
  });

  it("omits mask_image_id when no uploaded mask image is present", () => {
    const settings = gptImage2Adapter.buildSettings(baseData);

    expect(settings).not.toHaveProperty("mask_image_id");
  });

  it("forwards an uploaded mask_image_id in Image Upload mode", () => {
    const settings = gptImage2Adapter.buildSettings({
      ...baseData,
      frameType: "upload",
      maskImages: ["mask-asset-1"]
    } as GptImage2Data);

    expect(settings.mask_image_id).toBe("mask-asset-1");
  });
});
