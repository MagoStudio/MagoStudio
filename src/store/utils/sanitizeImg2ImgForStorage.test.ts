import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import { sanitizeImg2ImgForStorage } from "./sanitizeImg2ImgForStorage";

describe("sanitizeImg2ImgForStorage", () => {
  it("strips the transient drawn-mask blobs while keeping the anchors", () => {
    const values = {
      model: "seedream_5_pro",
      frameType: "video",
      prompt: "a prompt",
      referenceImages: ["ref-1"],
      generationCost: 120,
      maskFrameIdx: 12,
      maskLayerDataUrl: "data:image/png;base64,AAAA",
      maskedFrameSrc: "data:image/png;base64,BBBB"
    } as unknown as Img2ImgType;

    const result = sanitizeImg2ImgForStorage(values) as Record<string, unknown>;

    expect(result.maskLayerDataUrl).toBeUndefined();
    expect(result.maskedFrameSrc).toBeUndefined();
    expect(result.maskFrameIdx).toBe(12);
    expect(result.prompt).toBe("a prompt");
    expect(result.referenceImages).toEqual(["ref-1"]);
  });

  it("returns equivalent values for a model that has no drawn-mask fields", () => {
    const values = {
      model: "gpt_image_2",
      frameType: "video",
      prompt: "another prompt",
      quality: "high",
      maskImages: [],
      referenceImages: ["ref-2"],
      generationCost: 190
    } as unknown as Img2ImgType;

    const result = sanitizeImg2ImgForStorage(values);

    expect(result).toEqual(values);
  });
});
