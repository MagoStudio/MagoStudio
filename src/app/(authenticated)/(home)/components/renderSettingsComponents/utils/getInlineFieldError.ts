import { SourceImage } from "@domains/renders/types";
import { generateVideoValidationSchema } from "@models/video/generateVideoValidationSchema";
import { VideoModelDefinition } from "@models/video/types";

export const getInlineFieldError = (
  model: VideoModelDefinition,
  values: Record<string, unknown> | undefined,
  name: string,
  sources: SourceImage[] = []
): string | undefined => {
  const result = generateVideoValidationSchema(model, sources).safeParse(
    values ?? {}
  );
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.includes(name))
    ?.message;
};
