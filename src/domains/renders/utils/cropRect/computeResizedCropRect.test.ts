import { describe, expect, it } from "vitest";

import { computeResizedCropRect } from "./computeResizedCropRect";

const CENTERED_HALF_CROP = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
const MIN_SIZE = 0.05;

describe("computeResizedCropRect", () => {
  it("dragging the bottom-right handle inward shrinks the selection, keeping top-left fixed", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "bottomRight",
      pointerX: 0.6,
      pointerY: 0.6,
      minSize: MIN_SIZE
    });

    expect(result).toEqual({ x: 0.25, y: 0.25, width: 0.35, height: 0.35 });
  });

  it("dragging the top-left handle outward grows the selection, keeping bottom-right fixed", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "topLeft",
      pointerX: 0.1,
      pointerY: 0.1,
      minSize: MIN_SIZE
    });

    expect(result).toEqual({ x: 0.1, y: 0.1, width: 0.65, height: 0.65 });
  });

  it("dragging the top-right handle moves the top and right edges, keeping the bottom-left fixed", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "topRight",
      pointerX: 0.9,
      pointerY: 0.1,
      minSize: MIN_SIZE
    });

    expect(result.x).toBeCloseTo(0.25, 5);
    expect(result.y).toBeCloseTo(0.1, 5);
    expect(result.width).toBeCloseTo(0.65, 5);
    expect(result.height).toBeCloseTo(0.65, 5);
  });

  it("dragging the bottom-left handle moves the bottom and left edges, keeping the top-right fixed", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "bottomLeft",
      pointerX: 0.1,
      pointerY: 0.9,
      minSize: MIN_SIZE
    });

    expect(result.x).toBeCloseTo(0.1, 5);
    expect(result.y).toBeCloseTo(0.25, 5);
    expect(result.width).toBeCloseTo(0.65, 5);
    expect(result.height).toBeCloseTo(0.65, 5);
  });

  it("clamps the pointer to the frame bounds", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "bottomRight",
      pointerX: 1.5,
      pointerY: -0.5,
      minSize: MIN_SIZE
    });

    expect(result.width).toBeCloseTo(0.75, 5);
    expect(result.height).toBeCloseTo(0.25, 5);
  });

  it("enforces the minimum size instead of collapsing to zero", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "bottomRight",
      pointerX: 0.25,
      pointerY: 0.25,
      minSize: MIN_SIZE
    });

    expect(result.width).toBeCloseTo(MIN_SIZE, 5);
    expect(result.height).toBeCloseTo(MIN_SIZE, 5);
  });

  it("never produces a negative or zero area", () => {
    const result = computeResizedCropRect({
      crop: CENTERED_HALF_CROP,
      corner: "topLeft",
      pointerX: 1,
      pointerY: 1,
      minSize: MIN_SIZE
    });

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
});
