import { DEFAULT_ZOOM_INDEX, ZOOM_LEVELS } from "../constants";

const BASE_ZOOM_PERCENT = ZOOM_LEVELS[DEFAULT_ZOOM_INDEX];

export function getTimelineContentWidth(
  trackAreaWidth: number,
  zoomPercent: number
): number {
  return trackAreaWidth * (zoomPercent / BASE_ZOOM_PERCENT);
}
