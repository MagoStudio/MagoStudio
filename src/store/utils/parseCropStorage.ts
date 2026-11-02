import {
  hasPositiveCropArea,
  NormalizedCropRect
} from "@domains/renders/utils/cropRect";

export interface CropStorageShape {
  crop: NormalizedCropRect | undefined;
}

const isUnitRangeNumber = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

const isValidCropRect = (value: unknown): value is NormalizedCropRect => {
  if (typeof value !== "object" || value === null) return false;
  const rect = value as Record<string, unknown>;
  return (
    isUnitRangeNumber(rect.x) &&
    isUnitRangeNumber(rect.y) &&
    isUnitRangeNumber(rect.width) &&
    isUnitRangeNumber(rect.height) &&
    hasPositiveCropArea({ crop: rect as unknown as NormalizedCropRect })
  );
};

export const parseCropStorage = (
  value: unknown,
  fallback: CropStorageShape
): CropStorageShape => {
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as Record<string, unknown>;
  if (!("crop" in candidate)) return fallback;
  if (candidate.crop === undefined) return { crop: undefined };
  if (isValidCropRect(candidate.crop)) return { crop: candidate.crop };
  return fallback;
};
