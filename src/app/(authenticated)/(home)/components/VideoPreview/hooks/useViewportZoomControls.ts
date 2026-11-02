import { PERCENTAGE_MULTIPLIER } from "@constants";
import {
  VIEWPORT_MAX_ZOOM,
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_ZOOM_STEP,
  clampViewportZoom,
  quantizeViewportZoom,
  viewModeAtom,
  viewportPanZoomAtom,
  viewportPanZoomIsActiveAtom
} from "@store/atoms";
import { useAtom, useAtomValue } from "jotai";

type Result = {
  zoomPct: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

export function useViewportZoomControls(): Result {
  const [viewMode] = useAtom(viewModeAtom);
  const [viewport, setViewport] = useAtom(viewportPanZoomAtom);
  const isViewportActive = useAtomValue(viewportPanZoomIsActiveAtom);

  const hasMeasuredViewport =
    viewport.viewportWidth > 0 && viewport.viewportHeight > 0;

  const canUseZoom = isViewportActive && hasMeasuredViewport;

  const canZoomOut = canUseZoom && viewport.zoom > VIEWPORT_MIN_ZOOM;
  const canZoomIn = canUseZoom && viewport.zoom < VIEWPORT_MAX_ZOOM;
  const zoomPct = Math.round(viewport.zoom * PERCENTAGE_MULTIPLIER);

  const applyZoomDelta = (delta: number) => {
    setViewport((prev) => {
      const oldZoom = prev.zoom;
      const nextZoom = quantizeViewportZoom(clampViewportZoom(oldZoom + delta));

      if (nextZoom === oldZoom) return prev;

      if (nextZoom === VIEWPORT_MIN_ZOOM) {
        return { ...prev, zoom: nextZoom, x: 0, y: 0 };
      }

      const viewportWidth = prev.viewportWidth || 0;
      const viewportHeight = prev.viewportHeight || 0;
      const cx = viewportWidth / 2;
      const cy = viewportHeight / 2;
      const k = nextZoom / oldZoom;

      const nextX = prev.x * k + (1 - k) * cx;
      const nextY = prev.y * k + (1 - k) * cy;

      return { ...prev, zoom: nextZoom, x: nextX, y: nextY };
    });
  };

  const resetZoom = () => {
    setViewport((prev) => ({ ...prev, zoom: VIEWPORT_MIN_ZOOM, x: 0, y: 0 }));
  };

  return {
    zoomPct,
    canZoomIn,
    canZoomOut,
    zoomIn: () => applyZoomDelta(VIEWPORT_ZOOM_STEP),
    zoomOut: () => applyZoomDelta(-VIEWPORT_ZOOM_STEP),
    resetZoom
  };
}
