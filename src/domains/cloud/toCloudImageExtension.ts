const CLOUD_ACCEPTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const CLOUD_CONVERTED_IMAGE_EXTENSION = "png";

export const toCloudImageExtension = (localExtension: string): string => {
  const normalizedExtension = localExtension.replace(/^\./, "").toLowerCase();
  return CLOUD_ACCEPTED_IMAGE_EXTENSIONS.has(normalizedExtension)
    ? normalizedExtension
    : CLOUD_CONVERTED_IMAGE_EXTENSION;
};
