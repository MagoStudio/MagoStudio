const readImageAssetId = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

export const readImageToVideoFrameImageIds = (
  settings: Record<string, unknown>
): { startImageAssetId: string; endImageAssetId?: string } => {
  const startImageAssetId = readImageAssetId(settings.image_id);
  if (!startImageAssetId)
    throw new Error("Image-to-Video renders need a start image");
  const endImageAssetId = readImageAssetId(settings.end_image_id);
  return endImageAssetId
    ? { startImageAssetId, endImageAssetId }
    : { startImageAssetId };
};
