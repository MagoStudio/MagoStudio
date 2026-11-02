import {
  computeResizedCropRect,
  CropCorner,
  NormalizedCropRect
} from "@domains/renders/utils/cropRect";
import { useRef } from "react";

const MIN_CROP_SIZE_FRACTION = 0.05;

interface DragState {
  pointerId: number;
  corner: CropCorner;
}

export function useCropCornerDrag({
  crop,
  setCrop,
  contentBoxRef
}: {
  crop: NormalizedCropRect;
  setCrop: (crop: NormalizedCropRect) => void;
  contentBoxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<DragState | null>(null);

  const toNormalizedPointerPosition = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } => {
    const box = contentBoxRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
    return {
      x: (clientX - box.left) / box.width,
      y: (clientY - box.top) / box.height
    };
  };

  const onCornerPointerDown =
    (corner: CropCorner) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      dragRef.current = { pointerId: event.pointerId, corner };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  const onCornerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();

    const { x, y } = toNormalizedPointerPosition(event.clientX, event.clientY);

    setCrop(
      computeResizedCropRect({
        crop,
        corner: drag.corner,
        pointerX: x,
        pointerY: y,
        minSize: MIN_CROP_SIZE_FRACTION
      })
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    dragRef.current = null;
  };

  return {
    onCornerPointerDown,
    onCornerPointerMove,
    onCornerPointerUp: endDrag,
    onCornerPointerCancel: endDrag
  };
}
