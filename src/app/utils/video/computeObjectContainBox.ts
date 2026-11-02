export interface ObjectContainBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const computeObjectContainBox = ({
  containerWidth,
  containerHeight,
  mediaWidth,
  mediaHeight
}: {
  containerWidth: number;
  containerHeight: number;
  mediaWidth: number;
  mediaHeight: number;
}): ObjectContainBox => {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  }

  const containerRatio = containerWidth / containerHeight;
  const mediaRatio = mediaWidth / mediaHeight;

  if (mediaRatio > containerRatio) {
    const width = containerWidth;
    const height = width / mediaRatio;
    return { left: 0, top: (containerHeight - height) / 2, width, height };
  }

  const height = containerHeight;
  const width = height * mediaRatio;
  return { left: (containerWidth - width) / 2, top: 0, width, height };
};
