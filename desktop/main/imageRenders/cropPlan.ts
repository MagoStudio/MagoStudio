export interface CropCoordinates {
  top_left: [number, number];
  bottom_right: [number, number];
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropPlan {
  inputCrop: CropRect | null;
  requested: CropRect;
}

export interface CropBack {
  sourceDims: [number, number];
  rect: CropRect;
}

export const CROP_ALIGN = 64;
const MIN_DELIVERED_SIZE = 2;

const snapUp = (value: number, align: number): number =>
  Math.ceil(value / align) * align;

const snapAxisToAlign = (
  start: number,
  length: number,
  extent: number,
  align: number
): [number, number] => {
  const end = start + length;
  let snappedStart = Math.max(0, start - (start % 2));
  let snappedLength = snapUp(end - snappedStart, align);
  if (snappedLength > extent) snappedLength = extent - (extent % 2);
  if (snappedStart + snappedLength > extent) {
    snappedStart = Math.max(0, extent - snappedLength);
    snappedStart -= snappedStart % 2;
  }
  return [snappedStart, snappedLength];
};

const growAxisToEvenMinimum = (
  start: number,
  length: number,
  extent: number
): [number, number] => {
  const target = Math.min(MIN_DELIVERED_SIZE, extent);
  if (length >= target) return [start, length];
  const grownStart = Math.max(0, Math.min(start, extent - target));
  return [grownStart, target];
};

const toCornerPair = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [x, y] = value;
  if (typeof x !== "number" || typeof y !== "number") return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [x, y];
};

export const readCropCoordinates = (
  value: unknown
): CropCoordinates | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { top_left, bottom_right } = value as Record<string, unknown>;
  const topLeft = toCornerPair(top_left);
  const bottomRight = toCornerPair(bottom_right);
  if (!topLeft || !bottomRight) return undefined;
  return { top_left: topLeft, bottom_right: bottomRight };
};

export const readSourceDimensions = (
  value: unknown
): [number, number] | undefined => {
  const pair = toCornerPair(value);
  if (!pair) return undefined;
  const [width, height] = pair;
  if (width <= 0 || height <= 0) return undefined;
  return [width, height];
};

export const assertSourceDimensionsMatch = (
  declaredDimensions: [number, number],
  decodedDimensions: [number, number]
): void => {
  const [declaredWidth, declaredHeight] = declaredDimensions;
  const [decodedWidth, decodedHeight] = decodedDimensions;
  if (declaredWidth === decodedWidth && declaredHeight === decodedHeight) {
    return;
  }
  throw new Error(
    "The crop was drawn against a different video size than the one on disk " +
      `(crop: ${declaredWidth}x${declaredHeight}, video: ${decodedWidth}x${decodedHeight}). ` +
      "Redraw the crop on the current video."
  );
};

export const normalizeCrop = (
  sourceDimensions: [number, number],
  cropCoordinates: CropCoordinates | undefined,
  align: number = CROP_ALIGN
): CropPlan | null => {
  if (!cropCoordinates) return null;
  const [width, height] = sourceDimensions;
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid source video dimensions: ${width}x${height}`);
  }

  const clamp = (value: number, extent: number): number =>
    Math.max(0, Math.min(Math.round(value), extent));

  const left = clamp(cropCoordinates.top_left[0], width);
  const top = clamp(cropCoordinates.top_left[1], height);
  const right = clamp(cropCoordinates.bottom_right[0], width);
  const bottom = clamp(cropCoordinates.bottom_right[1], height);

  if (right - left <= 0 || bottom - top <= 0) {
    throw new Error("The crop area is empty. Draw a larger crop area.");
  }

  const [requestedX, requestedWidth] = growAxisToEvenMinimum(
    left,
    right - left,
    width
  );
  const [requestedY, requestedHeight] = growAxisToEvenMinimum(
    top,
    bottom - top,
    height
  );

  const coversWholeFrame =
    requestedX === 0 &&
    requestedY === 0 &&
    requestedWidth === width &&
    requestedHeight === height;
  if (coversWholeFrame) return null;

  const requested: CropRect = {
    x: requestedX,
    y: requestedY,
    w: requestedWidth,
    h: requestedHeight
  };

  const [snappedX, snappedWidth] = snapAxisToAlign(
    requestedX,
    requestedWidth,
    width,
    align
  );
  const [snappedY, snappedHeight] = snapAxisToAlign(
    requestedY,
    requestedHeight,
    height,
    align
  );

  const snappedCoversWholeFrame =
    snappedX === 0 &&
    snappedY === 0 &&
    snappedWidth === width &&
    snappedHeight === height;

  return {
    inputCrop: snappedCoversWholeFrame
      ? null
      : { x: snappedX, y: snappedY, w: snappedWidth, h: snappedHeight },
    requested
  };
};

export const toCropBack = (
  plan: CropPlan,
  sourceDimensions: [number, number]
): CropBack => {
  const appliedCrop = plan.inputCrop ?? {
    x: 0,
    y: 0,
    w: sourceDimensions[0],
    h: sourceDimensions[1]
  };
  return {
    sourceDims: [appliedCrop.w, appliedCrop.h],
    rect: {
      x: plan.requested.x - appliedCrop.x,
      y: plan.requested.y - appliedCrop.y,
      w: plan.requested.w,
      h: plan.requested.h
    }
  };
};

export const toCropCoordinates = (rect: CropRect): CropCoordinates => ({
  top_left: [rect.x, rect.y],
  bottom_right: [rect.x + rect.w, rect.y + rect.h]
});

export const cropFilter = (rect: CropRect): string =>
  `crop=${rect.w}:${rect.h}:${rect.x}:${rect.y}`;

export const cropBackFilter = (cropBack: CropBack): string | null => {
  const [sourceWidth, sourceHeight] = cropBack.sourceDims;
  const { x, y, w, h } = cropBack.rect;
  if (sourceWidth <= 0 || sourceHeight <= 0 || w <= 0 || h <= 0) return null;

  const evenScaled = (value: number, source: number, dimension: string) =>
    `round(${value}*${dimension}/${source}/2)*2`;

  return (
    `crop=w='min(${evenScaled(w, sourceWidth, "iw")},iw)':` +
    `h='min(${evenScaled(h, sourceHeight, "ih")},ih)':` +
    `x='max(min(${evenScaled(x, sourceWidth, "iw")},iw-ow),0)':` +
    `y='max(min(${evenScaled(y, sourceHeight, "ih")},ih-oh),0)'`
  );
};
