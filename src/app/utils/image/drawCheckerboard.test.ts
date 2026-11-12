import { describe, expect, it, vi } from "vitest";

import { drawCheckerboard } from "./drawCheckerboard";

const createRecordingContext = () => {
  const filledRects: { color: string; rect: number[] }[] = [];
  const ctx = {
    fillStyle: "",
    fillRect: vi.fn(function (this: { fillStyle: string }, ...rect: number[]) {
      filledRects.push({ color: this.fillStyle, rect });
    })
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, filledRects };
};

describe("drawCheckerboard", () => {
  it("fills the whole canvas with the light colour first", () => {
    const { ctx, filledRects } = createRecordingContext();

    drawCheckerboard(ctx, 64, 32);

    expect(filledRects[0]).toEqual({
      color: "#ffffff",
      rect: [0, 0, 64, 32]
    });
  });

  it("alternates dark squares between rows", () => {
    const { ctx, filledRects } = createRecordingContext();

    drawCheckerboard(ctx, 64, 32);

    const darkSquareOrigins = filledRects
      .filter((filled) => filled.color === "#cccccc")
      .map((filled) => filled.rect.slice(0, 2));
    expect(darkSquareOrigins).toEqual([
      [16, 0],
      [48, 0],
      [0, 16],
      [32, 16]
    ]);
  });
});
