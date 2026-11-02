import { SourceImageType } from "@domains/renders/types";
import { SOURCE_IMAGE_TYPES } from "@schemas/sourceImageType";

const isSourceImageType = (value: unknown): value is SourceImageType =>
  (SOURCE_IMAGE_TYPES as readonly string[]).includes(value as string);

export const parseSourceImageType = (
  value: unknown,
  fallback: SourceImageType
): SourceImageType => (isSourceImageType(value) ? value : fallback);
