const VIDEO_MIME_TYPE = "video/mp4";
const MAX_FILE_NAME_LENGTH = 100;
const DEFAULT_FILE_NAME = "render";

const sanitizeShotFileName = (layerName: string): string => {
  const sanitized = layerName
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, MAX_FILE_NAME_LENGTH);
  return sanitized || DEFAULT_FILE_NAME;
};

export const buildShotVideoFileFromBlob = (
  blob: Blob,
  layerName: string
): File => {
  const fileName = sanitizeShotFileName(layerName);
  return new File([blob], `${fileName}.mp4`, {
    type: blob.type || VIDEO_MIME_TYPE
  });
};
