const FALLBACK_DOWNLOAD_NAME = "image";
const FALLBACK_DOWNLOAD_EXTENSION = "jpg";

export const buildDownloadFilename = (name: string | undefined): string => {
  const nameWithoutTrailingDots = (name || FALLBACK_DOWNLOAD_NAME).replace(
    /\.+$/,
    ""
  );
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(nameWithoutTrailingDots);

  if (hasExtension) return nameWithoutTrailingDots;

  return `${nameWithoutTrailingDots}.${FALLBACK_DOWNLOAD_EXTENSION}`;
};
