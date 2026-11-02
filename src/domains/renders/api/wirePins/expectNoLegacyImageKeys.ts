import { expect } from "vitest";

const LEGACY_IMAGE_KEYS = [
  "image_ids",
  "elements",
  "image_id",
  "reference_image_ids"
] as const;

export const expectNoLegacyImageKeys = (
  wireSettings: Record<string, unknown>
): void => {
  for (const legacyImageKey of LEGACY_IMAGE_KEYS) {
    expect(legacyImageKey in wireSettings).toBe(false);
  }
};
