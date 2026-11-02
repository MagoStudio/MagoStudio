import {
  ADD_CELL_WIDTH_RATIO,
  TRACK_HORIZONTAL_PADDING_PX
} from "../constants";

export function getTimelineClipsAreaWidth(contentWidth: number): number {
  const addCellWidth = contentWidth * ADD_CELL_WIDTH_RATIO;
  return Math.max(0, contentWidth - addCellWidth - TRACK_HORIZONTAL_PADDING_PX);
}
