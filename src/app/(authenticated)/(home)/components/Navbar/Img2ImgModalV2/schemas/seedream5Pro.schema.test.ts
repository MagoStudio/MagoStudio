import { describe, expect, it } from "vitest";

import { SEEDREAM_5_PRO_COST, Seedream5ProSchema } from "./seedream5Pro.schema";

describe("Seedream5ProSchema", () => {
  const validBase = {
    model: "seedream_5_pro" as const,
    frameType: "video" as const,
    prompt: "test prompt"
  };

  it("parses with defaults when minimal fields provided", () => {
    const result = Seedream5ProSchema.parse(validBase);

    expect(result.model).toBe("seedream_5_pro");
    expect(result.generationCost).toBe(SEEDREAM_5_PRO_COST);
    expect(result.referenceImages).toEqual([]);
  });

  it("defaults the flat cost to 120 credits", () => {
    expect(SEEDREAM_5_PRO_COST).toBe(120);
    expect(Seedream5ProSchema.parse(validBase).generationCost).toBe(120);
  });

  it("accepts up to 9 reference images", () => {
    const referenceImages = Array.from({ length: 9 }, (_, i) => `img-${i}`);
    const result = Seedream5ProSchema.parse({ ...validBase, referenceImages });

    expect(result.referenceImages).toHaveLength(9);
  });

  it("rejects more than 9 reference images", () => {
    const referenceImages = Array.from({ length: 10 }, (_, i) => `img-${i}`);

    expect(() =>
      Seedream5ProSchema.parse({ ...validBase, referenceImages })
    ).toThrow();
  });

  it("requires a non-empty prompt", () => {
    expect(() =>
      Seedream5ProSchema.parse({ ...validBase, prompt: "" })
    ).toThrow();
  });

  it("requires upload mode to have an image id", () => {
    expect(() =>
      Seedream5ProSchema.parse({ ...validBase, frameType: "upload" })
    ).toThrow();
  });

  it("accepts upload mode with uploadedImageId", () => {
    const result = Seedream5ProSchema.parse({
      ...validBase,
      frameType: "upload",
      uploadedImageId: "some-id"
    });

    expect(result.frameType).toBe("upload");
  });

  it("treats the drawn-mask fields as optional (absent by default)", () => {
    const result = Seedream5ProSchema.parse(validBase);

    expect(result.maskLayerDataUrl).toBeUndefined();
    expect(result.maskedFrameSrc).toBeUndefined();
    expect(result.maskFrameIdx).toBeUndefined();
  });

  it("parses the drawn-mask fields when present", () => {
    const result = Seedream5ProSchema.parse({
      ...validBase,
      maskLayerDataUrl: "data:image/png;base64,layer",
      maskedFrameSrc: "data:image/jpeg;base64,frame",
      maskFrameIdx: 7
    });

    expect(result.maskLayerDataUrl).toBe("data:image/png;base64,layer");
    expect(result.maskedFrameSrc).toBe("data:image/jpeg;base64,frame");
    expect(result.maskFrameIdx).toBe(7);
  });
});
