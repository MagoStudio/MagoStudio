import { PointerEvent, useRef, useState } from "react";

const DRAG_START_THRESHOLD_PX = 6;
const NATIVE_VIDEO_CONTROLS_HEIGHT_PX = 48;

interface DragState {
  pointerId: number;
  startClientX: number;
  startScrollLeft: number;
  hasMovedPastThreshold: boolean;
}

const isPointerOnNativeVideoControls = (
  target: EventTarget | null,
  clientY: number
): boolean => {
  const video = target instanceof Element ? target.closest("video") : null;
  if (!video) return false;
  return (
    video.getBoundingClientRect().bottom - clientY <=
    NATIVE_VIDEO_CONTROLS_HEIGHT_PX
  );
};

export const useDragToScroll = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressNextClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (isPointerOnNativeVideoControls(event.target, event.clientY)) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: container.scrollLeft,
      hasMovedPastThreshold: false
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const container = scrollContainerRef.current;
    if (!dragState || !container || dragState.pointerId !== event.pointerId) {
      return;
    }

    /* Below the threshold no pointer capture is set, so a flick that leaves the list before its
     * first move gets no pointerup here and leaves the drag armed. Returning over the list with
     * the button already up would then scroll it. The button state is the authority. */
    const hasButtonBeenReleased = event.buttons === 0;
    if (hasButtonBeenReleased) {
      dragStateRef.current = null;
      return;
    }

    const deltaX = event.clientX - dragState.startClientX;
    if (
      !dragState.hasMovedPastThreshold &&
      Math.abs(deltaX) < DRAG_START_THRESHOLD_PX
    ) {
      return;
    }

    if (!dragState.hasMovedPastThreshold) {
      dragState.hasMovedPastThreshold = true;
      container.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.preventDefault();
    container.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const container = scrollContainerRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (dragState.hasMovedPastThreshold) {
      suppressNextClickRef.current = true;
      container?.releasePointerCapture(event.pointerId);
      setIsDragging(false);
    }
    dragStateRef.current = null;
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    scrollContainerRef,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture
    }
  };
};
