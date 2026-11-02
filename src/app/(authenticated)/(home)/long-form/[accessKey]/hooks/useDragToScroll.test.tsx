import { act, renderHook } from "@testing-library/react";
import { PointerEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDragToScroll } from "./useDragToScroll";

const POINTER_ID = 7;

const createScrollContainer = () => {
  const container = document.createElement("div");
  let scrollLeftValue = 0;
  Object.defineProperty(container, "scrollLeft", {
    get: () => scrollLeftValue,
    set: (next: number) => {
      scrollLeftValue = next;
    }
  });
  container.setPointerCapture = vi.fn();
  container.releasePointerCapture = vi.fn();
  return container;
};

const buildPointerEvent = ({
  clientX,
  buttons = 1,
  button = 0,
  target
}: {
  clientX: number;
  buttons?: number;
  button?: number;
  target: HTMLDivElement;
}) =>
  ({
    pointerId: POINTER_ID,
    clientX,
    clientY: 0,
    button,
    buttons,
    target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  }) as unknown as PointerEvent<HTMLDivElement>;

const renderDragToScroll = () => {
  const container = createScrollContainer();
  const { result } = renderHook(() => useDragToScroll());
  act(() => {
    result.current.scrollContainerRef.current = container;
  });
  return { result, container };
};

describe("useDragToScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scrolls the container once the pointer moves past the drag threshold", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 460, target: container })
      );
    });

    expect(container.scrollLeft).toBe(140);
    expect(result.current.isDragging).toBe(true);
  });

  it("does not scroll for a move that stays below the drag threshold", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 497, target: container })
      );
    });

    expect(container.scrollLeft).toBe(100);
    expect(result.current.isDragging).toBe(false);
  });

  it("does not scroll when the pointer returns with the button already released outside the list", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 300, buttons: 0, target: container })
      );
    });

    expect(container.scrollLeft).toBe(100);
    expect(result.current.isDragging).toBe(false);
  });

  it("disarms the drag entirely, so a later move with a button held does not resume scrolling", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 300, buttons: 0, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 250, target: container })
      );
    });

    expect(container.scrollLeft).toBe(100);
    expect(result.current.isDragging).toBe(false);
  });

  it("releases pointer capture and stops dragging on pointerup", () => {
    const { result, container } = renderDragToScroll();

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 460, target: container })
      );
      result.current.dragHandlers.onPointerUp(
        buildPointerEvent({ clientX: 460, buttons: 0, target: container })
      );
    });

    expect(container.releasePointerCapture).toHaveBeenCalledWith(POINTER_ID);
    expect(result.current.isDragging).toBe(false);
  });

  it("suppresses the click that follows a completed drag, then lets the next one through", () => {
    const { result, container } = renderDragToScroll();

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 460, target: container })
      );
      result.current.dragHandlers.onPointerUp(
        buildPointerEvent({ clientX: 460, buttons: 0, target: container })
      );
    });

    const suppressedClick = buildPointerEvent({
      clientX: 460,
      target: container
    });
    const followingClick = buildPointerEvent({
      clientX: 460,
      target: container
    });

    act(() => {
      result.current.dragHandlers.onClickCapture(
        suppressedClick as unknown as React.MouseEvent<HTMLDivElement>
      );
      result.current.dragHandlers.onClickCapture(
        followingClick as unknown as React.MouseEvent<HTMLDivElement>
      );
    });

    expect(suppressedClick.preventDefault).toHaveBeenCalled();
    expect(followingClick.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores a pointerdown from a non-primary button", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, button: 2, target: container })
      );
      result.current.dragHandlers.onPointerMove(
        buildPointerEvent({ clientX: 460, target: container })
      );
    });

    expect(container.scrollLeft).toBe(100);
  });

  it("ignores a move from a different pointer than the one that started the drag", () => {
    const { result, container } = renderDragToScroll();
    container.scrollLeft = 100;

    act(() => {
      result.current.dragHandlers.onPointerDown(
        buildPointerEvent({ clientX: 500, target: container })
      );
      result.current.dragHandlers.onPointerMove({
        ...buildPointerEvent({ clientX: 460, target: container }),
        pointerId: POINTER_ID + 1
      } as unknown as PointerEvent<HTMLDivElement>);
    });

    expect(container.scrollLeft).toBe(100);
  });
});
