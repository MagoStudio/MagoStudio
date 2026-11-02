export const buildBulkRenderingDraftShotImageSourceFrameOverrides = ({
  imageSourceFrameByShotId,
  defaultImageSourceFrame
}: {
  imageSourceFrameByShotId: Record<string, number>;
  defaultImageSourceFrame: number;
}): Record<string, number> =>
  Object.fromEntries(
    Object.entries(imageSourceFrameByShotId).filter(
      ([, frame]) => frame !== defaultImageSourceFrame
    )
  );
