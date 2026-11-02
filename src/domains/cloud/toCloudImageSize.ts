export const toCloudImageSize = ({
  width,
  height
}: {
  width: number | null;
  height: number | null;
}): [number, number] | null => {
  const imageWidth = Math.round(width ?? 0);
  const imageHeight = Math.round(height ?? 0);
  const hasPositiveImageDimensions = imageWidth > 0 && imageHeight > 0;
  return hasPositiveImageDimensions ? [imageWidth, imageHeight] : null;
};
