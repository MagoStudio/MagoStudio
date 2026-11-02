import { describe, expect, it } from "vitest";

import { getActiveFrameRangePreset } from "./getActiveFrameRangePreset";

describe("getActiveFrameRangePreset", () => {
  it("matches the full clip preset", () => {
    expect(
      getActiveFrameRangePreset({
        range: [0, 200],
        fullClipRange: [0, 200],
        oneSecondRange: [0, 30]
      })
    ).toBe("full");
  });

  it("matches the one-second preset", () => {
    expect(
      getActiveFrameRangePreset({
        range: [40, 64],
        fullClipRange: [0, 200],
        oneSecondRange: [40, 64]
      })
    ).toBe("oneSecond");
  });

  it("matches neither preset", () => {
    expect(
      getActiveFrameRangePreset({
        range: [18, 25],
        fullClipRange: [0, 200],
        oneSecondRange: [40, 64]
      })
    ).toBeNull();
  });

  it("prefers full when the clip is exactly one second long", () => {
    expect(
      getActiveFrameRangePreset({
        range: [0, 30],
        fullClipRange: [0, 30],
        oneSecondRange: [0, 30]
      })
    ).toBe("full");
  });
});
