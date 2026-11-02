import { describe, expect, it } from "vitest";

import { getOnboardingRenderRange } from "./getOnboardingRenderRange";

describe("getOnboardingRenderRange", () => {
  const FPS = 24;

  it("truncates a longer clip to the fixed 3.2s window", () => {
    expect(getOnboardingRenderRange(240, FPS)).toEqual([0, 77]);
  });

  it("returns the whole clip when it equals the 3.2s window", () => {
    expect(getOnboardingRenderRange(77, FPS)).toEqual([0, 77]);
  });

  it("clamps to the clip length when it is shorter than 3.2s", () => {
    expect(getOnboardingRenderRange(50, FPS)).toEqual([0, 50]);
  });

  it("scales the target frame count with fps", () => {
    expect(getOnboardingRenderRange(300, 30)).toEqual([0, 96]);
  });

  it("rounds the target frame count half-up in both directions", () => {
    expect(getOnboardingRenderRange(1000, 23)).toEqual([0, 74]);
    expect(getOnboardingRenderRange(1000, 26)).toEqual([0, 83]);
  });

  it("clamps to an empty range when the clip has no frames", () => {
    expect(getOnboardingRenderRange(0, FPS)).toEqual([0, 0]);
  });
});
