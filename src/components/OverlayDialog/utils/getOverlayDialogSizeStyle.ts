export type OverlayDialogSize =
  | { mode: "fixed"; widthPx: number; heightPx: number }
  | { mode: "inset"; insetXPx: number; insetYPx: number }
  | { mode: "hug"; maxWidthPx: number; viewportMarginPx?: number };

export type OverlayDialogViewport = { widthPx: number; heightPx: number };

export type OverlayDialogSizeStyle = {
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
};

const DEFAULT_HUG_VIEWPORT_MARGIN_PX = 32;

export function getOverlayDialogSizeStyle(
  size: OverlayDialogSize,
  viewport: OverlayDialogViewport
): OverlayDialogSizeStyle {
  if (size.mode === "fixed") {
    return {
      width: Math.min(size.widthPx, viewport.widthPx),
      height: Math.min(size.heightPx, viewport.heightPx)
    };
  }

  if (size.mode === "inset") {
    return {
      width: Math.max(viewport.widthPx - size.insetXPx * 2, 0),
      height: Math.max(viewport.heightPx - size.insetYPx * 2, 0)
    };
  }

  const margin = size.viewportMarginPx ?? DEFAULT_HUG_VIEWPORT_MARGIN_PX;
  const isViewportMeasured = viewport.widthPx > 0 && viewport.heightPx > 0;

  if (!isViewportMeasured) return { maxWidth: size.maxWidthPx };

  return {
    maxWidth: Math.min(
      size.maxWidthPx,
      Math.max(viewport.widthPx - margin * 2, 0)
    ),
    maxHeight: Math.max(viewport.heightPx - margin * 2, 0)
  };
}
