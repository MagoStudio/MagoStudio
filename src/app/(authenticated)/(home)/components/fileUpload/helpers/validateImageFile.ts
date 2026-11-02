import { getImageDimensions } from "@utils";
import {
  getImageLimitErrorKey,
  IMAGE_UPLOAD_LIMITS
} from "@utils/image/imageUploadLimits";

import { getFileExtension } from "./getFileExtension";

const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png"];
const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MIN_FILE_SIZE = 1024;

const IMAGE_FILE_ERROR_KEYS = {
  UNSUPPORTED_FORMAT:
    "notifications.upload_button_notification_image_file_format.description",
  FILE_EMPTY: "notifications.upload_button_file_empty.description",
  FILE_CORRUPTED: "notifications.upload_button_file_corrupted.description",
  FILE_READ_ERROR: "notifications.upload_button_file_read_error.description",
  IMAGE_TOO_BIG: "notifications.upload_button_image_input_too_big.description"
} as const;

const validateImageFileSync = (file: File): string | null => {
  const fileExtension = getFileExtension(file.name);

  if (!fileExtension || !SUPPORTED_EXTENSIONS.includes(fileExtension)) {
    return IMAGE_FILE_ERROR_KEYS.UNSUPPORTED_FORMAT;
  }

  if (!SUPPORTED_MIME_TYPES.some((type) => file.type.startsWith(type))) {
    return IMAGE_FILE_ERROR_KEYS.UNSUPPORTED_FORMAT;
  }

  if (file.size > IMAGE_UPLOAD_LIMITS.maxFileSizeBytes) {
    return IMAGE_FILE_ERROR_KEYS.IMAGE_TOO_BIG;
  }

  if (file.size === 0) {
    return IMAGE_FILE_ERROR_KEYS.FILE_EMPTY;
  }

  if (file.size < MIN_FILE_SIZE) {
    return IMAGE_FILE_ERROR_KEYS.FILE_CORRUPTED;
  }

  return null;
};

export const validateImageFile = async (file: File): Promise<string | null> => {
  const syncError = validateImageFileSync(file);
  if (syncError) return syncError;

  try {
    const limitErrorKey = getImageLimitErrorKey(
      file,
      await getImageDimensions(file)
    );
    if (limitErrorKey) {
      return `notifications.${limitErrorKey}.description`;
    }
  } catch (error) {
    console.error("Image dimension validation failed:", error);
    return IMAGE_FILE_ERROR_KEYS.FILE_READ_ERROR;
  }

  return null;
};
