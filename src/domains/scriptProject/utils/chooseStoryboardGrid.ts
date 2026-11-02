export type StoryboardGrid = {
  columnCount: number;
  rowCount: number;
};

const panelAreaOnSheet = ({
  columnCount,
  rowCount,
  sheetAspectRatio,
  panelAspectRatio
}: StoryboardGrid & {
  sheetAspectRatio: number;
  panelAspectRatio: number;
}): number => {
  const cellWidth = sheetAspectRatio / columnCount;
  const cellHeight = 1 / rowCount;
  const panelWidth = Math.min(cellWidth, cellHeight * panelAspectRatio);
  return panelWidth * (panelWidth / panelAspectRatio);
};

export const chooseStoryboardGrid = ({
  panelCount,
  sheetAspectRatio,
  panelAspectRatio
}: {
  panelCount: number;
  sheetAspectRatio: number;
  panelAspectRatio: number;
}): StoryboardGrid => {
  const candidateGrids = Array.from(
    { length: panelCount },
    (_unused, index) => {
      const columnCount = index + 1;
      const rowCount = Math.ceil(panelCount / columnCount);
      return {
        columnCount,
        rowCount,
        panelArea: panelAreaOnSheet({
          columnCount,
          rowCount,
          sheetAspectRatio,
          panelAspectRatio
        }),
        blankCellCount: columnCount * rowCount - panelCount
      };
    }
  );

  const [bestGrid] = candidateGrids.sort(
    (first, second) =>
      second.panelArea - first.panelArea ||
      first.blankCellCount - second.blankCellCount ||
      second.columnCount - first.columnCount
  );
  return { columnCount: bestGrid.columnCount, rowCount: bestGrid.rowCount };
};
