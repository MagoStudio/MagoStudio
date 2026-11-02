import {
  STORYBOARD_GRID_SPACING_PX,
  STORYBOARD_IMAGE_SIZE
} from "../constants";

import { chooseStoryboardGrid } from "./chooseStoryboardGrid";

export type StoryboardPanelBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type StoryboardGridLayout = {
  columnCount: number;
  rowCount: number;
  panelBoxes: StoryboardPanelBox[];
};

export const layoutStoryboardGrid = ({
  panelCount,
  panelAspectRatio
}: {
  panelCount: number;
  panelAspectRatio: number;
}): StoryboardGridLayout => {
  const { width: sheetWidth, height: sheetHeight } = STORYBOARD_IMAGE_SIZE;
  const { sheetMargin, gutter, numberBand } = STORYBOARD_GRID_SPACING_PX;
  if (panelCount <= 0) return { columnCount: 0, rowCount: 0, panelBoxes: [] };

  const { columnCount, rowCount } = chooseStoryboardGrid({
    panelCount,
    sheetAspectRatio: sheetWidth / sheetHeight,
    panelAspectRatio
  });
  const cellWidth =
    (sheetWidth - 2 * sheetMargin - (columnCount - 1) * gutter) / columnCount;
  const cellHeight =
    (sheetHeight - 2 * sheetMargin - (rowCount - 1) * gutter) / rowCount;
  const panelHeight = Math.floor(
    Math.min(cellHeight - numberBand, cellWidth / panelAspectRatio)
  );
  const panelWidth = Math.floor(panelHeight * panelAspectRatio);
  const blockWidth = columnCount * panelWidth + (columnCount - 1) * gutter;
  const blockHeight =
    rowCount * (panelHeight + numberBand) + (rowCount - 1) * gutter;
  const blockLeft = Math.floor((sheetWidth - blockWidth) / 2);
  const blockTop = Math.floor((sheetHeight - blockHeight) / 2);

  return {
    columnCount,
    rowCount,
    panelBoxes: Array.from({ length: panelCount }, (_unused, panelIndex) => {
      const columnIndex = panelIndex % columnCount;
      const rowIndex = Math.floor(panelIndex / columnCount);
      const left = blockLeft + columnIndex * (panelWidth + gutter);
      const top =
        blockTop + rowIndex * (panelHeight + numberBand + gutter) + numberBand;
      return { left, top, right: left + panelWidth, bottom: top + panelHeight };
    })
  };
};
