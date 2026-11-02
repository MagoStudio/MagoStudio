const MULTIPLE_OF = 16;
const FALLBACK_LONG_SIDE = 640;

export const padToMultipleOf16 = (value: number): number =>
  Math.max(MULTIPLE_OF, Math.ceil(value / MULTIPLE_OF) * MULTIPLE_OF);

const roundToEven = (value: number): number =>
  Math.max(2, Math.round(value / 2) * 2);

export const fitWanDimensions = (
  width: number,
  height: number,
  maxSize: number | undefined
): { width: number; height: number } => {
  const longSide =
    typeof maxSize === "number" && maxSize > 0 ? maxSize : FALLBACK_LONG_SIDE;
  if (width <= 0 || height <= 0) {
    const evenLongSide = roundToEven(longSide);
    return { width: evenLongSide, height: evenLongSide };
  }
  const scale = longSide / Math.max(width, height);
  return {
    width: roundToEven(width * scale),
    height: roundToEven(height * scale)
  };
};
