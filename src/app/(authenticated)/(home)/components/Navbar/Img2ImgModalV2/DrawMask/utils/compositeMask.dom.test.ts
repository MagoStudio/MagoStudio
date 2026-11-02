import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MASK_OPACITY } from "../constants";

import { __resetCompositeMaskCache, compositeMask } from "./compositeMask";

describe("compositeMask", () => {
  let currentAlpha = 1;
  const drawCalls: number[] = [];
  const drawImage = vi.fn(() => {
    drawCalls.push(currentAlpha);
  });
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    __resetCompositeMaskCache();
    drawImage.mockClear();
    drawCalls.length = 0;
    currentAlpha = 1;

    const mockContext = {
      drawImage,
      set globalAlpha(value: number) {
        currentAlpha = value;
      },
      get globalAlpha() {
        return currentAlpha;
      }
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,MERGED")
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      if (tag === "canvas") {
        return mockCanvas;
      }
      return document.createElement(tag);
    }) as typeof document.createElement);

    global.Image = class MockImage {
      naturalWidth = 1920;
      naturalHeight = 1080;
      width = 1920;
      height = 1080;
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    } as unknown as typeof Image;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sizes the canvas to the frame's native dimensions", async () => {
    await compositeMask("frame-src", "data:image/png;base64,LAYER");

    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
  });

  it("draws the frame first at full opacity, then the mask layer at 90%", async () => {
    await compositeMask("frame-src", "data:image/png;base64,LAYER");

    expect(drawCalls).toEqual([1, MASK_OPACITY]);
  });

  it("returns the flattened canvas as a JPEG data-URL", async () => {
    const result = await compositeMask("frame-src", "data:image/png;base64,L");

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.92);
    expect(result).toBe("data:image/jpeg;base64,MERGED");
  });
});
