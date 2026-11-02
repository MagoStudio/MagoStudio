import { describe, expect, it } from "vitest";

import {
  BRUSH_DEFAULT_STEP,
  BRUSH_MAX_PX,
  BRUSH_MIN_PX,
  brushSizeForStep
} from "./brushSizeForStep";

describe("brushSizeForStep", () => {
  it("maps step 1 to the minimum pixel size", () => {
    expect(brushSizeForStep(1)).toBe(BRUSH_MIN_PX);
  });

  it("maps step 20 to the maximum pixel size", () => {
    expect(brushSizeForStep(20)).toBe(BRUSH_MAX_PX);
  });

  it("maps the default step 7 to ~65px", () => {
    expect(brushSizeForStep(BRUSH_DEFAULT_STEP)).toBeCloseTo(64.95, 2);
  });

  it("is linear with a ~9.16px step delta", () => {
    expect(brushSizeForStep(2) - brushSizeForStep(1)).toBeCloseTo(9.16, 2);
  });

  it("clamps steps below 1 to the minimum", () => {
    expect(brushSizeForStep(0)).toBe(BRUSH_MIN_PX);
    expect(brushSizeForStep(-5)).toBe(BRUSH_MIN_PX);
  });

  it("clamps steps above 20 to the maximum", () => {
    expect(brushSizeForStep(21)).toBe(BRUSH_MAX_PX);
    expect(brushSizeForStep(100)).toBe(BRUSH_MAX_PX);
  });
});
