import { STORYBOARD_IMAGE_SIZE } from "../constants";

import { StoryboardPanelBox } from "./layoutStoryboardGrid";

const PANEL_BORDER_WIDTH_PX = 6;
const NUMBER_CIRCLE_RADIUS_PX = 21;
const NUMBER_CIRCLE_BORDER_WIDTH_PX = 4;
const NUMBER_CIRCLE_OFFSET_PX = { fromLeft: 22, aboveTop: 28 };
const NUMBER_FONT_SIZE_PX = 30;

export const buildStoryboardGridSvg = ({
  panelBoxes,
  hasWhitePaper
}: {
  panelBoxes: StoryboardPanelBox[];
  hasWhitePaper: boolean;
}): string => {
  const { width, height } = STORYBOARD_IMAGE_SIZE;
  const halfBorder = PANEL_BORDER_WIDTH_PX / 2;
  const panels = panelBoxes
    .map((box, panelIndex) => {
      const circleX = box.left + NUMBER_CIRCLE_OFFSET_PX.fromLeft;
      const circleY = box.top - NUMBER_CIRCLE_OFFSET_PX.aboveTop;
      return [
        `<rect x="${box.left + halfBorder}" y="${box.top + halfBorder}" width="${box.right - box.left - PANEL_BORDER_WIDTH_PX}" height="${box.bottom - box.top - PANEL_BORDER_WIDTH_PX}" fill="none" stroke="#000" stroke-width="${PANEL_BORDER_WIDTH_PX}"/>`,
        `<circle cx="${circleX}" cy="${circleY}" r="${NUMBER_CIRCLE_RADIUS_PX}" fill="#fff" stroke="#000" stroke-width="${NUMBER_CIRCLE_BORDER_WIDTH_PX}"/>`,
        `<text x="${circleX}" y="${circleY}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${NUMBER_FONT_SIZE_PX}" text-anchor="middle" dominant-baseline="central" fill="#000">${panelIndex + 1}</text>`
      ].join("");
    })
    .join("");
  const paper = hasWhitePaper
    ? `<rect width="${width}" height="${height}" fill="#fff"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paper}${panels}</svg>`;
};
