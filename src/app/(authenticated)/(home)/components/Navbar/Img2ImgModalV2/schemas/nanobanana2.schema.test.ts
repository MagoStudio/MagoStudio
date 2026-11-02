import { describe, expect, it } from "vitest";

import {
  NANOBANANA_2_RESOLUTION_COST,
  NANOBANANA_2_RESOLUTIONS,
  Nanobanana2Schema
} from "./nanobanana2.schema";

describe("Nanobanana2Schema", () => {
  const validBase = {
    model: "nanobanana_2" as const,
    frameType: "video" as const,
    prompt: "test prompt"
  };

  it("parses with defaults when minimal fields provided", () => {
    const result = Nanobanana2Schema.parse(validBase);

    expect(result.model).toBe("nanobanana_2");
    expect(result.resolution).toBe("2K");
    expect(result.generationCost).toBe(NANOBANANA_2_RESOLUTION_COST["2K"]);
    expect(result.referenceImages).toEqual([]);
  });

  it.each(NANOBANANA_2_RESOLUTIONS)("accepts resolution %s", (resolution) => {
    const result = Nanobanana2Schema.parse({ ...validBase, resolution });

    expect(result.resolution).toBe(resolution);
  });

  it("rejects invalid resolution", () => {
    expect(() =>
      Nanobanana2Schema.parse({ ...validBase, resolution: "3K" })
    ).toThrow();
  });

  it("accepts up to 9 reference images", () => {
    const referenceImages = Array.from({ length: 9 }, (_, i) => `img-${i}`);
    const result = Nanobanana2Schema.parse({ ...validBase, referenceImages });

    expect(result.referenceImages).toHaveLength(9);
  });

  it("rejects more than 9 reference images", () => {
    const referenceImages = Array.from({ length: 10 }, (_, i) => `img-${i}`);

    expect(() =>
      Nanobanana2Schema.parse({ ...validBase, referenceImages })
    ).toThrow();
  });

  it("requires a non-empty prompt", () => {
    expect(() =>
      Nanobanana2Schema.parse({ ...validBase, prompt: "" })
    ).toThrow();
  });

  it("requires upload mode to have an image id", () => {
    expect(() =>
      Nanobanana2Schema.parse({ ...validBase, frameType: "upload" })
    ).toThrow();
  });

  it("accepts upload mode with uploadedImageId", () => {
    const result = Nanobanana2Schema.parse({
      ...validBase,
      frameType: "upload",
      uploadedImageId: "some-id"
    });

    expect(result.frameType).toBe("upload");
  });
});

describe("NANOBANANA_2_RESOLUTION_COST", () => {
  it("maps all resolutions to expected costs", () => {
    expect(NANOBANANA_2_RESOLUTION_COST).toEqual({
      "0.5K": 92,
      "1K": 122,
      "2K": 183,
      "4K": 243
    });
  });

  it("has an entry for every resolution option", () => {
    for (const resolution of NANOBANANA_2_RESOLUTIONS) {
      expect(NANOBANANA_2_RESOLUTION_COST[resolution]).toBeGreaterThan(0);
    }
  });
});
