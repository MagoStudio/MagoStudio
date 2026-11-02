const IMAGE_EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

const IMAGE_FILENAME_EXTENSION = /\.(png|jpe?g|webp)$/i;

export const withImageExtensionMatchingContentType = (
  filename: string,
  contentType: string
): string => {
  const extensionForContentType = IMAGE_EXTENSION_BY_CONTENT_TYPE[contentType];
  if (!extensionForContentType) return filename;
  if (!IMAGE_FILENAME_EXTENSION.test(filename)) return filename;
  return filename.replace(
    IMAGE_FILENAME_EXTENSION,
    `.${extensionForContentType}`
  );
};
