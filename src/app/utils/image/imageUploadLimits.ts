const MAX_FILE_SIZE_BYTES = 50000000;

export const IMAGE_UPLOAD_LIMITS = {
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  minDimension: 300,
  maxDimension: 5600
};

export type ImageDimensions = { width: number; height: number };
export type ImageUploadLimits = typeof IMAGE_UPLOAD_LIMITS;

export const getImageLimitErrorKey = (
  file: File,
  dimensions: ImageDimensions,
  limits: ImageUploadLimits = IMAGE_UPLOAD_LIMITS
):
  | "upload_button_image_input_too_small"
  | "upload_button_image_input_too_big"
  | null => {
  const minSide = Math.min(dimensions.width, dimensions.height);
  const maxSide = Math.max(dimensions.width, dimensions.height);

  if (file.size > limits.maxFileSizeBytes || maxSide > limits.maxDimension) {
    return "upload_button_image_input_too_big";
  }

  if (minSide < limits.minDimension) {
    return "upload_button_image_input_too_small";
  }

  return null;
};
