import { generateVideoValidationSchema } from "@models/video/generateVideoValidationSchema";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";

export interface SettingValidationError {
  key: string;
  message: string;
}

export const validateBulkRenderingShotVideoSettings = (
  model: VideoModelDefinition,
  values: VideoSettings
): SettingValidationError[] => {
  const result = generateVideoValidationSchema(model).safeParse(values);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    key: String(issue.path[0]),
    message: issue.message
  }));
};
