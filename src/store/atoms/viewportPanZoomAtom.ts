import { atom } from "jotai";

export const VIEWPORT_MIN_ZOOM = 1;
export const VIEWPORT_MAX_ZOOM = 5;
export const VIEWPORT_ZOOM_STEP = 0.25;
export const VIEWPORT_ZOOM_STEP_WHEEL = 0.1;
export const VIEWPORT_ZOOM_STEP_FINE = 0.01;

export const viewportPanZoomIsActiveAtom = atom(false);

export type ViewportPanZoomState = {
  zoom: number;
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
};

export const viewportPanZoomAtom = atom<ViewportPanZoomState>({
  zoom: VIEWPORT_MIN_ZOOM,
  x: 0,
  y: 0,
  viewportWidth: 0,
  viewportHeight: 0
});

export function clampViewportZoom(zoom: number): number {
  return Math.min(VIEWPORT_MAX_ZOOM, Math.max(VIEWPORT_MIN_ZOOM, zoom));
}

function quantizeViewportZoomWithStep(zoom: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return zoom;
  const quantized = Math.round(zoom / step) * step;
  return Number(quantized.toFixed(2));
}

export function quantizeViewportZoom(zoom: number): number {
  return quantizeViewportZoomWithStep(zoom, VIEWPORT_ZOOM_STEP);
}

export function quantizeViewportZoomFine(zoom: number): number {
  return quantizeViewportZoomWithStep(zoom, VIEWPORT_ZOOM_STEP_FINE);
}

export function quantizeViewportZoomWheel(zoom: number): number {
  return quantizeViewportZoomWithStep(zoom, VIEWPORT_ZOOM_STEP_WHEEL);
}
