interface ContainFitDimensions {
  width: number;
  height: number;
}

export const computeContainFit = (
  containerWidth: number,
  containerHeight: number,
  aspect: number
): ContainFitDimensions => {
  const widthBound = {
    width: containerWidth,
    height: containerWidth / aspect
  };
  if (widthBound.height <= containerHeight) return widthBound;
  return { width: containerHeight * aspect, height: containerHeight };
};
