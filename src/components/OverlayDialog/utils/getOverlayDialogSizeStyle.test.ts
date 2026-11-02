import { describe, expect, it } from "vitest";

import { getOverlayDialogSizeStyle } from "./getOverlayDialogSizeStyle";

describe("getOverlayDialogSizeStyle", () => {
  it("returns the requested fixed dimensions when they fit the viewport", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "fixed", widthPx: 735, heightPx: 546 },
        { widthPx: 1280, heightPx: 800 }
      )
    ).toEqual({ width: 735, height: 546 });
  });

  it("caps fixed dimensions at the viewport when the viewport is smaller", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "fixed", widthPx: 735, heightPx: 546 },
        { widthPx: 600, heightPx: 400 }
      )
    ).toEqual({ width: 600, height: 400 });
  });

  it("caps only the dimension that exceeds the viewport", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "fixed", widthPx: 735, heightPx: 546 },
        { widthPx: 700, heightPx: 800 }
      )
    ).toEqual({ width: 700, height: 546 });
  });

  it("fills the viewport minus the horizontal inset on both sides and the vertical inset on both sides", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "inset", insetXPx: 32, insetYPx: 56 },
        { widthPx: 1440, heightPx: 855 }
      )
    ).toEqual({ width: 1376, height: 743 });
  });

  it("supports independent horizontal and vertical insets", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "inset", insetXPx: 24, insetYPx: 10 },
        { widthPx: 1280, heightPx: 800 }
      )
    ).toEqual({ width: 1232, height: 780 });
  });

  it("never returns a negative size when an inset exceeds the viewport", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "inset", insetXPx: 1000, insetYPx: 1000 },
        { widthPx: 500, heightPx: 300 }
      )
    ).toEqual({ width: 0, height: 0 });
  });

  it("hugs its content, capping the width at the requested maximum", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "hug", maxWidthPx: 640 },
        { widthPx: 1280, heightPx: 800 }
      )
    ).toEqual({ maxWidth: 640, maxHeight: 736 });
  });

  it("shrinks the hug maximum when the viewport is narrower than it", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "hug", maxWidthPx: 640 },
        { widthPx: 500, heightPx: 800 }
      )
    ).toEqual({ maxWidth: 436, maxHeight: 736 });
  });

  it("honours a custom hug margin", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "hug", maxWidthPx: 640, viewportMarginPx: 8 },
        { widthPx: 1280, heightPx: 800 }
      )
    ).toEqual({ maxWidth: 640, maxHeight: 784 });
  });

  it("falls back to the requested maximum before the viewport is measured", () => {
    expect(
      getOverlayDialogSizeStyle(
        { mode: "hug", maxWidthPx: 640 },
        { widthPx: 0, heightPx: 0 }
      )
    ).toEqual({ maxWidth: 640 });
  });
});
