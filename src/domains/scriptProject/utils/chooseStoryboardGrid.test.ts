import { describe, expect, it } from "vitest";

import { chooseStoryboardGrid } from "./chooseStoryboardGrid";

const WIDESCREEN_SHEET = 16 / 9;

const gridFor = (panelCount: number, panelAspectRatio: number) =>
  chooseStoryboardGrid({
    panelCount,
    sheetAspectRatio: WIDESCREEN_SHEET,
    panelAspectRatio
  });

describe("chooseStoryboardGrid", () => {
  it.each([
    [1, { columnCount: 1, rowCount: 1 }],
    [2, { columnCount: 2, rowCount: 1 }],
    [3, { columnCount: 3, rowCount: 1 }],
    [4, { columnCount: 4, rowCount: 1 }],
    [5, { columnCount: 5, rowCount: 1 }]
  ])("puts %i portrait 9:16 panel(s) side by side", (panelCount, grid) => {
    expect(gridFor(panelCount, 9 / 16)).toEqual(grid);
  });

  it.each([
    [1, { columnCount: 1, rowCount: 1 }],
    [2, { columnCount: 2, rowCount: 1 }],
    [3, { columnCount: 2, rowCount: 2 }],
    [4, { columnCount: 2, rowCount: 2 }],
    [5, { columnCount: 3, rowCount: 2 }]
  ])("lays out %i landscape 16:9 panel(s) in a grid", (panelCount, grid) => {
    expect(gridFor(panelCount, 16 / 9)).toEqual(grid);
  });

  it("prefers the grid with no blank cells when panels come out the same size", () => {
    expect(gridFor(4, 1)).toEqual({ columnCount: 2, rowCount: 2 });
  });
});
