const IMAGE_TO_VIDEO_FRAME_IMAGE_SETTING_KEYS = [
  "image_id",
  "end_image_id"
] as const;

export const mirrorImageToVideoFrameImages = async (
  renderSettings: Record<string, unknown>,
  mirrorImage: (localAssetId: string) => Promise<string>
): Promise<Record<string, unknown>> => {
  const cloudRenderSettings = { ...renderSettings };
  for (const settingKey of IMAGE_TO_VIDEO_FRAME_IMAGE_SETTING_KEYS) {
    const localAssetId = renderSettings[settingKey];
    if (typeof localAssetId !== "string" || !localAssetId) continue;
    cloudRenderSettings[settingKey] = await mirrorImage(localAssetId);
  }
  return cloudRenderSettings;
};
