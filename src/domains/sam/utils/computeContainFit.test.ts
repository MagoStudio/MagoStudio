import { describe, it, expect } from "vitest";

import { computeContainFit } from "./computeContainFit";

describe("computeContainFit", () => {
  it("returns width-bound dimensions when container is taller than aspect requires", () => {
    expect(computeContainFit(400, 800, 16 / 9)).toEqual({
      width: 400,
      height: 225
    });
  });

  it("returns height-bound dimensions when container is wider than aspect requires", () => {
    expect(computeContainFit(800, 400, 9 / 16)).toEqual({
      width: 225,
      height: 400
    });
  });

  it("fills exactly when container matches the source aspect", () => {
    expect(computeContainFit(640, 360, 16 / 9)).toEqual({
      width: 640,
      height: 360
    });
  });

  it("handles a square container with a vertical source", () => {
    expect(computeContainFit(500, 500, 9 / 16)).toEqual({
      width: 281.25,
      height: 500
    });
  });

  it("contains a 4K UHD landscape source (3840×2160) inside a small viewport", () => {
    const result = computeContainFit(800, 600, 3840 / 2160);
    expect(result.width).toBeLessThanOrEqual(800);
    expect(result.height).toBeLessThanOrEqual(600);
    expect(result.width / result.height).toBeCloseTo(3840 / 2160, 5);
  });
});
