import { describe, expect, it } from "vitest";

import { STORYBOARD_IMAGE_SIZE } from "../constants";

import { layoutStoryboardGrid } from "./layoutStoryboardGrid";

const PORTRAIT = 9 / 16;
const LANDSCAPE = 16 / 9;

describe("layoutStoryboardGrid", () => {
  it("puts portrait panels side by side at the panel's own shape", () => {
    const { rowCount, columnCount, panelBoxes } = layoutStoryboardGrid({
      panelCount: 4,
      panelAspectRatio: PORTRAIT
    });
    expect({ rowCount, columnCount }).toEqual({ rowCount: 1, columnCount: 4 });
    expect(panelBoxes[0]).toEqual({
      left: 42,
      top: 156,
      right: 381,
      bottom: 760
    });
    expect(panelBoxes[3]!.right).toBe(1494);
  });

  it("lays landscape panels in rows, leaving the last cell empty", () => {
    const { rowCount, columnCount, panelBoxes } = layoutStoryboardGrid({
      panelCount: 5,
      panelAspectRatio: LANDSCAPE
    });
    expect({ rowCount, columnCount }).toEqual({ rowCount: 2, columnCount: 3 });
    expect(panelBoxes).toHaveLength(5);
    expect(panelBoxes[3]!.left).toBe(panelBoxes[0]!.left);
    expect(panelBoxes[3]!.top).toBeGreaterThan(panelBoxes[0]!.bottom);
  });

  it("keeps every panel on the sheet and at the requested shape", () => {
    for (const panelCount of [1, 2, 3, 6])
      for (const panelAspectRatio of [PORTRAIT, LANDSCAPE, 1])
        for (const box of layoutStoryboardGrid({ panelCount, panelAspectRatio })
          .panelBoxes) {
          expect(box.left).toBeGreaterThanOrEqual(0);
          expect(box.top).toBeGreaterThanOrEqual(0);
          expect(box.right).toBeLessThanOrEqual(STORYBOARD_IMAGE_SIZE.width);
          expect(box.bottom).toBeLessThanOrEqual(STORYBOARD_IMAGE_SIZE.height);
          expect((box.right - box.left) / (box.bottom - box.top)).toBeCloseTo(
            panelAspectRatio,
            1
          );
        }
  });

  it("returns no panels for a Scene without Beats", () => {
    expect(
      layoutStoryboardGrid({ panelCount: 0, panelAspectRatio: PORTRAIT })
        .panelBoxes
    ).toEqual([]);
  });
});
