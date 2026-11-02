export const resolveImg2ImgFrame = (
  iteratedAssetId: string | undefined,
  iteratedSourceFrame: number | undefined,
  currentFrame: number
): number =>
  iteratedAssetId ? (iteratedSourceFrame ?? currentFrame) : currentFrame;
