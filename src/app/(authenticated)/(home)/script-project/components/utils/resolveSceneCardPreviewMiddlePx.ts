import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";

const SCENE_CARD_WIDTH_PX = 432;
const SCENE_CARD_BORDER_PX = 2;
const SCENE_CARD_PADDING_PX = 12;
const SCENE_CARD_HEADER_ROW_HEIGHT_PX = 24;
const SCENE_CARD_GAP_PX = 16;
const SCENE_PREVIEW_MAX_HEIGHT_PX = 620;

export const resolveSceneCardPreviewMiddlePx = ([
  outputWidthPx,
  outputHeightPx
]: ProjectOutputSize): number => {
  const previewAreaWidthPx =
    SCENE_CARD_WIDTH_PX - 2 * (SCENE_CARD_BORDER_PX + SCENE_CARD_PADDING_PX);
  const isOutputSizeUsable = outputWidthPx > 0 && outputHeightPx > 0;
  const previewHeightPx = isOutputSizeUsable
    ? Math.min(
        SCENE_PREVIEW_MAX_HEIGHT_PX,
        (previewAreaWidthPx * outputHeightPx) / outputWidthPx
      )
    : previewAreaWidthPx;
  const previewTopPx =
    SCENE_CARD_BORDER_PX +
    SCENE_CARD_PADDING_PX +
    SCENE_CARD_HEADER_ROW_HEIGHT_PX +
    SCENE_CARD_GAP_PX;
  return Math.round(previewTopPx + previewHeightPx / 2);
};
