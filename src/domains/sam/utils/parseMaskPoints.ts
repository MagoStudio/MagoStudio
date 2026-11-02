import type { MaskPreviewPoint } from "@store/maskPreviewStore";

export const parseMaskPoints = (
  value: string | undefined
): MaskPreviewPoint[] => {
  if (!value || value.trim() === "" || value === "[]") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export const serializeMaskPoints = (points: MaskPreviewPoint[]): string =>
  points.length > 0 ? JSON.stringify(points) : "";
