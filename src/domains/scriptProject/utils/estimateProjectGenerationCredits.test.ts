import { describe, expect, it } from "vitest";

import { estimateProjectGenerationCredits } from "./estimateProjectGenerationCredits";

const defaults = {
  entityCount: 8,
  shotCount: 12,
  attemptsPerShot: 1,
  creditsPerSheetImage: 60,
  creditsPerShotRender: 179
};

describe("estimateProjectGenerationCredits", () => {
  it("adds the entity images to the shot renders", () => {
    expect(estimateProjectGenerationCredits(defaults)).toEqual({
      assetCredits: 480,
      shotCredits: 2148,
      totalCredits: 2628
    });
  });

  it("multiplies the shot half by the attempts, and leaves the images alone", () => {
    expect(
      estimateProjectGenerationCredits({ ...defaults, attemptsPerShot: 2 })
    ).toEqual({
      assetCredits: 480,
      shotCredits: 4296,
      totalCredits: 4776
    });
  });

  it("has no total when the sheet image price is unknown", () => {
    expect(
      estimateProjectGenerationCredits({
        ...defaults,
        creditsPerSheetImage: null
      })
    ).toBeNull();
  });

  it("is zero before anything has been cast", () => {
    expect(
      estimateProjectGenerationCredits({
        ...defaults,
        entityCount: 0,
        shotCount: 0
      })
    ).toEqual({ assetCredits: 0, shotCredits: 0, totalCredits: 0 });
  });

  it("counts a production that is all entities and no shots", () => {
    expect(
      estimateProjectGenerationCredits({ ...defaults, shotCount: 0 })
    ).toEqual({ assetCredits: 480, shotCredits: 0, totalCredits: 480 });
  });

  it("rounds each component up before summing, never the total", () => {
    expect(
      estimateProjectGenerationCredits({
        entityCount: 2,
        shotCount: 2,
        attemptsPerShot: 1,
        creditsPerSheetImage: 60.2,
        creditsPerShotRender: 179.4
      })
    ).toEqual({ assetCredits: 122, shotCredits: 360, totalCredits: 482 });
  });
});
