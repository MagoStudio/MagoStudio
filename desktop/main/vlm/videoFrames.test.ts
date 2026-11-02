import { describe, expect, it } from "vitest";

import { selectGridFrameIndices } from "./videoFrames";

describe("selectGridFrameIndices", () => {
  it("samples a single grid's worth for a short clip", () => {
    const indices = selectGridFrameIndices(300);
    // 300 frames / step 20 = 15 candidate frames, under one 25-cell grid, so
    // the count is clamped to one grid.
    expect(indices).toHaveLength(25);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(299);
  });

  it("samples two grids once the clip is long enough, and never more", () => {
    // 1000 / 20 = 50 candidates = exactly two grids.
    expect(selectGridFrameIndices(1000)).toHaveLength(50);
    // Ingestion would allow four grids here; the local cap is two.
    expect(selectGridFrameIndices(20_000)).toHaveLength(50);
  });

  it("always includes the first and last frame", () => {
    for (const total of [2, 37, 300, 1000, 5000]) {
      const indices = selectGridFrameIndices(total);
      expect(indices[0]).toBe(0);
      expect(indices.at(-1)).toBe(total - 1);
    }
  });

  it("returns sorted, unique indices even when the clip is shorter than a grid", () => {
    const indices = selectGridFrameIndices(7);
    expect(indices).toEqual([...new Set(indices)]);
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
    expect(indices.every((index) => index >= 0 && index < 7)).toBe(true);
  });

  it("handles degenerate frame counts", () => {
    expect(selectGridFrameIndices(1)).toEqual([0]);
    expect(selectGridFrameIndices(0)).toEqual([0]);
  });
});
