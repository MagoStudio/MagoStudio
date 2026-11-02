export interface WanOutputDimensions {
  width: number;
  height: number;
}

const FALLBACK_LONG_SIDE = 640;

const roundToEven = (value: number): number =>
  Math.max(2, Math.round(value / 2) * 2);

export const computeWanOutputDimensions = (
  inputVideoWidth: number | undefined,
  inputVideoHeight: number | undefined,
  maxSize: number | undefined
): WanOutputDimensions => {
  const longSide =
    typeof maxSize === "number" && maxSize > 0 ? maxSize : FALLBACK_LONG_SIDE;

  const hasValidInputDimensions =
    typeof inputVideoWidth === "number" &&
    typeof inputVideoHeight === "number" &&
    inputVideoWidth > 0 &&
    inputVideoHeight > 0;

  if (!hasValidInputDimensions) {
    const evenLongSide = roundToEven(longSide);
    return { width: evenLongSide, height: evenLongSide };
  }

  const scale = longSide / Math.max(inputVideoWidth, inputVideoHeight);
  return {
    width: roundToEven(inputVideoWidth * scale),
    height: roundToEven(inputVideoHeight * scale)
  };
};
