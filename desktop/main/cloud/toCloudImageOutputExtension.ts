import path from "node:path";

const CLOUD_IMAGE_OUTPUT_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

const readUrlPathname = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

export const toCloudImageOutputExtension = (
  outputUrl: string,
  fallbackExtension: string
): string => {
  const outputFileExtension = path.posix
    .extname(readUrlPathname(outputUrl))
    .slice(1)
    .toLowerCase();
  return CLOUD_IMAGE_OUTPUT_EXTENSIONS.has(outputFileExtension)
    ? outputFileExtension
    : fallbackExtension;
};
