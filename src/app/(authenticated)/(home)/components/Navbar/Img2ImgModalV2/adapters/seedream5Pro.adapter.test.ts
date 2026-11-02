import { describe, expect, it } from "vitest";

import { Img2ImgType } from "../schemas";

import { seedream5ProAdapter } from "./seedream5Pro.adapter";

type Seedream5ProData = Extract<Img2ImgType, { model: "seedream_5_pro" }>;

const baseData = {
  model: "seedream_5_pro",
  frameType: "video",
  prompt: "test",
  referenceImages: [],
  generationCost: 120
} as unknown as Seedream5ProData;

describe("seedream5ProAdapter", () => {
  it("forces a single output (num_images: 1)", () => {
    expect(seedream5ProAdapter.buildSettings(baseData).num_images).toBe(1);
  });

  it("computes the flat cost from generationCost", () => {
    expect(seedream5ProAdapter.computeCost(baseData)).toBe(120);
  });

  it("is not available in relaxed/unlimited mode", () => {
    expect(seedream5ProAdapter.availableInRelaxedMode).toBe(false);
  });
});
