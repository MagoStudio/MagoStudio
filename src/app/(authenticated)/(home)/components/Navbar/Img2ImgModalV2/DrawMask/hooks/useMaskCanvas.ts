import React, { useRef } from "react";

import { MASK_COLOR } from "../constants";
import type { MaskTool } from "../types";

type Params = {
  naturalWidth: number;
  naturalHeight: number;
  tool: MaskTool;
  brushPx: number;
};

type Point = { x: number; y: number };

export const useMaskCanvas = ({
  naturalWidth,
  naturalHeight,
  tool,
  brushPx
}: Params) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStrokingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const hasDrawnRef = useRef(false);
  const interactedRef = useRef(false);

  const appliedStyleRef = useRef<{ tool: MaskTool; radius: number } | null>(
    null
  );

  const getContext = () => canvasRef.current?.getContext("2d") ?? null;

  const mapPoint = (
    clientX: number,
    clientY: number
  ): { point: Point; scale: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    const scale = canvas.width / rect.width;
    return {
      point: {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top) * scale
      },
      scale
    };
  };

  const applyToolStyle = (ctx: CanvasRenderingContext2D, radius: number) => {
    const last = appliedStyleRef.current;
    if (last && last.tool === tool && last.radius === radius) {
      return;
    }
    appliedStyleRef.current = { tool: tool, radius };
    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = MASK_COLOR;
      ctx.fillStyle = MASK_COLOR;
    }
    ctx.lineWidth = radius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const paintDot = (
    ctx: CanvasRenderingContext2D,
    p: Point,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const paintLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const ctx = getContext();
    const mapped = mapPoint(e.clientX, e.clientY);
    if (!ctx || !mapped) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    isStrokingRef.current = true;
    const radius = (brushPx / 2) * mapped.scale;
    applyToolStyle(ctx, radius);
    paintDot(ctx, mapped.point, radius);
    lastPointRef.current = mapped.point;
    hasDrawnRef.current = true;
    interactedRef.current = true;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isStrokingRef.current) {
      return;
    }
    const ctx = getContext();
    const mapped = mapPoint(e.clientX, e.clientY);
    if (!ctx || !mapped) {
      return;
    }
    const radius = (brushPx / 2) * mapped.scale;
    applyToolStyle(ctx, radius);
    if (lastPointRef.current) {
      paintLine(ctx, lastPointRef.current, mapped.point);
    }
    paintDot(ctx, mapped.point, radius);
    lastPointRef.current = mapped.point;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isStrokingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    const ctx = getContext();
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, naturalWidth, naturalHeight);
    hasDrawnRef.current = false;
    interactedRef.current = true;
  };

  const toDataURL = (): string | null => {
    if (!hasDrawnRef.current || !canvasRef.current) {
      return null;
    }
    return canvasRef.current.toDataURL("image/png");
  };

  const hasInteracted = () => interactedRef.current;

  const loadFromDataUrl = (dataUrl: string) => {
    const ctx = getContext();
    if (!ctx) {
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (interactedRef.current) {
        return;
      }
      ctx.clearRect(0, 0, naturalWidth, naturalHeight);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);
      hasDrawnRef.current = true;
      appliedStyleRef.current = null;
    };
    img.src = dataUrl;
  };

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    clear,
    toDataURL,
    loadFromDataUrl,
    hasInteracted
  };
};
