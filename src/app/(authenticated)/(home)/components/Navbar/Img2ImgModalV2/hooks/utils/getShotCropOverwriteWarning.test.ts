import { describe, expect, it } from "vitest";

import { getShotCropOverwriteWarning } from "./getShotCropOverwriteWarning";

const shotCrop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
const fullFrameCrop = { x: 0, y: 0, width: 1, height: 1 };

describe("getShotCropOverwriteWarning", () => {
  it("warns about a replacement when the used image carries a different crop", () => {
    expect(
      getShotCropOverwriteWarning({
        shotCrop,
        usedImageCropRect: { x: 0.1, y: 0.1, width: 0.4, height: 0.4 }
      })
    ).toBe("replace");
  });

  it("warns about a removal when the used image carries no crop", () => {
    expect(
      getShotCropOverwriteWarning({ shotCrop, usedImageCropRect: undefined })
    ).toBe("remove");
  });

  it("stays silent when the used image carries the crop already in place", () => {
    expect(
      getShotCropOverwriteWarning({
        shotCrop,
        usedImageCropRect: { ...shotCrop }
      })
    ).toBeUndefined();
  });

  it("stays silent when the shot has no crop to lose", () => {
    expect(
      getShotCropOverwriteWarning({
        shotCrop: undefined,
        usedImageCropRect: shotCrop
      })
    ).toBeUndefined();
  });

  it("stays silent when the shot crop covers the whole frame", () => {
    expect(
      getShotCropOverwriteWarning({
        shotCrop: fullFrameCrop,
        usedImageCropRect: undefined
      })
    ).toBeUndefined();
  });
});
