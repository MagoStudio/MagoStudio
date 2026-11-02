import { NormalizedCropRect } from "./types";

export type CropCorner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const getFixedCorner = (
  corner: CropCorner,
  crop: NormalizedCropRect
): { x: number; y: number } => {
  switch (corner) {
    case "topLeft":
      return { x: crop.x + crop.width, y: crop.y + crop.height };
    case "topRight":
      return { x: crop.x, y: crop.y + crop.height };
    case "bottomLeft":
      return { x: crop.x + crop.width, y: crop.y };
    case "bottomRight":
    default:
      return { x: crop.x, y: crop.y };
  }
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const computeResizedCropRect = ({
  crop,
  corner,
  pointerX,
  pointerY,
  minSize
}: {
  crop: NormalizedCropRect;
  corner: CropCorner;
  pointerX: number;
  pointerY: number;
  minSize: number;
}): NormalizedCropRect => {
  const fixed = getFixedCorner(corner, crop);
  const clampedPointerX = clamp(pointerX, 0, 1);
  const clampedPointerY = clamp(pointerY, 0, 1);

  const draggedX =
    fixed.x <= clampedPointerX
      ? Math.max(clampedPointerX, fixed.x + minSize)
      : Math.min(clampedPointerX, fixed.x - minSize);
  const draggedY =
    fixed.y <= clampedPointerY
      ? Math.max(clampedPointerY, fixed.y + minSize)
      : Math.min(clampedPointerY, fixed.y - minSize);

  const clampedDraggedX = clamp(draggedX, 0, 1);
  const clampedDraggedY = clamp(draggedY, 0, 1);

  const x = Math.min(fixed.x, clampedDraggedX);
  const y = Math.min(fixed.y, clampedDraggedY);
  const width = Math.abs(fixed.x - clampedDraggedX);
  const height = Math.abs(fixed.y - clampedDraggedY);

  return { x, y, width, height };
};
