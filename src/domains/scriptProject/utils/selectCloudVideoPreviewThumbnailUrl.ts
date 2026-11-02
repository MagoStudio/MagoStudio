type CloudVideoThumbnail = Record<string, unknown>;

const httpsUrl = (value: unknown): string | undefined =>
  typeof value === "string" && value.startsWith("https://") ? value : undefined;

export const selectCloudVideoPreviewThumbnailUrl = (
  thumbnails: CloudVideoThumbnail[]
): string | undefined => {
  const signedThumbnails = thumbnails.filter((thumbnail) =>
    httpsUrl(thumbnail.s3_url)
  );
  const preferredThumbnail =
    signedThumbnails.find((thumbnail) => !!thumbnail.first_frame) ??
    signedThumbnails.find((thumbnail) => !!thumbnail.single_frame) ??
    signedThumbnails[0];
  return httpsUrl(preferredThumbnail?.s3_url);
};
