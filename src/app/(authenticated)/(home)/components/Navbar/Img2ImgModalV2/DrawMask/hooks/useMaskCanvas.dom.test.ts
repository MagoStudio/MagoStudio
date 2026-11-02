import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MASK_COLOR } from "../constants";
import type { MaskTool } from "../types";

import { useMaskCanvas } from "./useMaskCanvas";

const makeContext = () => ({
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  globalCompositeOperation: "source-over",
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn()
});

const makePointerEvent = (clientX: number, clientY: number) =>
  ({
    clientX,
    clientY,
    pointerId: 1,
    currentTarget: {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => false,
      releasePointerCapture: vi.fn()
    }
  }) as unknown as React.PointerEvent;

const setup = (tool: MaskTool) => {
  const ctx = makeContext();
  const canvas = {
    width: 100,
    height: 100,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    toDataURL: () => "data:image/png;base64,LAYER"
  } as unknown as HTMLCanvasElement;

  const { result } = renderHook(() =>
    useMaskCanvas({ naturalWidth: 100, naturalHeight: 100, tool, brushPx: 20 })
  );
  result.current.canvasRef.current = canvas;
  return { result, ctx };
};

describe("useMaskCanvas", () => {
  it("paints with red #E54545 in source-over mode when drawing", () => {
    const { result, ctx } = setup("draw");

    result.current.onPointerDown(makePointerEvent(10, 10));

    expect(ctx.fillStyle).toBe(MASK_COLOR);
    expect(ctx.strokeStyle).toBe(MASK_COLOR);
    expect(ctx.globalCompositeOperation).toBe("source-over");
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("removes pixels via destination-out when erasing", () => {
    const { result, ctx } = setup("erase");

    result.current.onPointerDown(makePointerEvent(10, 10));

    expect(ctx.globalCompositeOperation).toBe("destination-out");
  });

  it("scales the brush radius from display px to native px on the layer", () => {
    const { result, ctx } = setup("draw");

    result.current.onPointerDown(makePointerEvent(50, 50));

    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 10, 0, Math.PI * 2);
  });

  it("clear() wipes the whole native canvas", () => {
    const { result, ctx } = setup("draw");

    result.current.clear();

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
  });

  it("toDataURL returns null until something is drawn, then the layer", () => {
    const { result } = setup("draw");

    expect(result.current.toDataURL()).toBeNull();

    result.current.onPointerDown(makePointerEvent(10, 10));
    expect(result.current.toDataURL()).toBe("data:image/png;base64,LAYER");
  });
});
