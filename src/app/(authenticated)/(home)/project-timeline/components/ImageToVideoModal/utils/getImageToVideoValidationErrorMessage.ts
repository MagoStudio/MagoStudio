import { generateVideoValidationSchema } from "@models/video/generateVideoValidationSchema";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";

export const getImageToVideoValidationErrorMessage = (
  model: VideoModelDefinition,
  values: VideoSettings
): string | undefined => {
  const result = generateVideoValidationSchema(model).safeParse(values);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
};
