/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import {
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_ZOOM_STEP_WHEEL,
  clampViewportZoom,
  isViewportFullscreenOpenAtom,
  quantizeViewportZoomFine,
  quantizeViewportZoomWheel,
  viewportPanZoomAtom,
  viewportPanZoomIsActiveAtom
} from "@store/atoms";
import { cn } from "@utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

type GestureState = {
  startZoom: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export const ViewportPanZoom: React.FC<Props> = ({ children, className }) => {
  const [viewport, setViewport] = useAtom(viewportPanZoomAtom);
  const setIsActive = useSetAtom(viewportPanZoomIsActiveAtom);
  const isViewportFullscreenOpen = useAtomValue(isViewportFullscreenOpenAtom);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef(viewport);
  const gestureRef = useRef<GestureState | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const isZoomed = viewport.zoom > VIEWPORT_MIN_ZOOM;

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    setIsActive(true);
    return () => setIsActive(false);
  }, [setIsActive]);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setViewport((prev) => ({
        ...prev,
        viewportWidth: rect.width,
        viewportHeight: rect.height
      }));
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [setViewport]);

  useEffect(() => {
    if (isViewportFullscreenOpen) return;

    const raf = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setViewport((prev) => ({
        ...prev,
        viewportWidth: rect.width,
        viewportHeight: rect.height
      }));
    });

    return () => cancelAnimationFrame(raf);
  }, [isViewportFullscreenOpen, setViewport]);

  useEffect(() => {
    if (
      viewport.zoom === VIEWPORT_MIN_ZOOM &&
      (viewport.x !== 0 || viewport.y !== 0)
    ) {
      setViewport((prev) => ({
        ...prev,
        x: 0,
        y: 0
      }));
    }
  }, [viewport.zoom, viewport.x, viewport.y, setViewport]);

  const cursorClass = useMemo(() => {
    if (!isZoomed) return "cursor-default";
    return isDragging ? "cursor-grabbing" : "cursor-grab";
  }, [isDragging, isZoomed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getLocalPoint = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const applyZoomDeltaTowardsPoint = (
      delta: number,
      originX: number,
      originY: number,
      quantize: (zoom: number) => number
    ) => {
      setViewport((prev) => {
        const oldZoom = prev.zoom;
        const clamped = quantize(clampViewportZoom(oldZoom + delta));

        if (clamped === oldZoom) return prev;

        if (clamped === VIEWPORT_MIN_ZOOM) {
          return { ...prev, zoom: clamped, x: 0, y: 0 };
        }

        const k = clamped / oldZoom;
        const nextX = prev.x * k + (1 - k) * originX;
        const nextY = prev.y * k + (1 - k) * originY;
        return { ...prev, zoom: clamped, x: nextX, y: nextY };
      });
    };

    const onWheel = (e: WheelEvent) => {
      const isMouseWheel =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ||
        e.deltaMode === WheelEvent.DOM_DELTA_PAGE;
      const isPinch = e.ctrlKey === true;

      const { zoom } = viewportRef.current;
      const isCurrentlyZoomed = zoom > VIEWPORT_MIN_ZOOM;

      if (isMouseWheel || isPinch) {
        if (e.deltaY === 0) return;
        e.preventDefault();

        const dir = Math.sign(-e.deltaY);
        const { x: originX, y: originY } = getLocalPoint(e.clientX, e.clientY);
        applyZoomDeltaTowardsPoint(
          dir * VIEWPORT_ZOOM_STEP_WHEEL,
          originX,
          originY,
          quantizeViewportZoomWheel
        );
        return;
      }

      if (isCurrentlyZoomed) {
        if (e.deltaX === 0 && e.deltaY === 0) return;
        e.preventDefault();
        setViewport((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    const onGestureStart = (e: any) => {
      if (!e) return;
      e.preventDefault?.();

      const { x: originX, y: originY } = getLocalPoint(
        typeof e.clientX === "number"
          ? e.clientX
          : el.getBoundingClientRect().left + el.clientWidth / 2,
        typeof e.clientY === "number"
          ? e.clientY
          : el.getBoundingClientRect().top + el.clientHeight / 2
      );

      const v = viewportRef.current;
      gestureRef.current = {
        startZoom: v.zoom,
        startX: v.x,
        startY: v.y,
        originX,
        originY
      };
    };

    const onGestureChange = (e: any) => {
      const g = gestureRef.current;
      if (!g) return;
      e.preventDefault?.();

      const scale = typeof e.scale === "number" ? e.scale : 1;
      const targetZoom = g.startZoom * scale;
      const nextZoom = quantizeViewportZoomFine(clampViewportZoom(targetZoom));

      setViewport((prev) => {
        if (nextZoom === g.startZoom)
          return { ...prev, zoom: g.startZoom, x: g.startX, y: g.startY };

        if (nextZoom === VIEWPORT_MIN_ZOOM) {
          return { ...prev, zoom: nextZoom, x: 0, y: 0 };
        }

        const k = nextZoom / g.startZoom;
        const nextX = g.startX * k + (1 - k) * g.originX;
        const nextY = g.startY * k + (1 - k) * g.originY;
        return { ...prev, zoom: nextZoom, x: nextX, y: nextY };
      });
    };

    const onGestureEnd = (e: any) => {
      e?.preventDefault?.();
      gestureRef.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart, {
      passive: false
    } as any);
    el.addEventListener("gesturechange", onGestureChange, {
      passive: false
    } as any);
    el.addEventListener("gestureend", onGestureEnd, { passive: false } as any);

    return () => {
      el.removeEventListener("wheel", onWheel as any);
      el.removeEventListener("gesturestart", onGestureStart as any);
      el.removeEventListener("gesturechange", onGestureChange as any);
      el.removeEventListener("gestureend", onGestureEnd as any);
    };
  }, [setViewport]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden select-none touch-none",
        cursorClass,
        className
      )}
      onPointerDown={(e) => {
        if (!isZoomed) return;
        if (!containerRef.current) return;

        setIsDragging(true);
        dragRef.current = {
          pointerId: e.pointerId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startPanX: viewport.x,
          startPanY: viewport.y
        };

        containerRef.current.setPointerCapture(e.pointerId);
        e.preventDefault();
      }}
      onPointerMove={(e) => {
        if (!isZoomed) return;
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;

        const dx = e.clientX - drag.startClientX;
        const dy = e.clientY - drag.startClientY;

        setViewport((prev) => ({
          ...prev,
          x: drag.startPanX + dx,
          y: drag.startPanY + dy
        }));
        e.preventDefault();
      }}
      onPointerUp={(e) => {
        const drag = dragRef.current;
        if (drag && containerRef.current) {
          try {
            containerRef.current.releasePointerCapture(drag.pointerId);
          } catch {}
        }
        dragRef.current = null;
        setIsDragging(false);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setIsDragging(false);
      }}
    >
      {/* translate wrapper */}
      <div
        className="h-full w-full"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px)`
        }}
      >
        {/* scale wrapper (scale first, then translate via outer wrapper) */}
        <div
          className="h-full w-full"
          style={{
            transform: `scale(${viewport.zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
