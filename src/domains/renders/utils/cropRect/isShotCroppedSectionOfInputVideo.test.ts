import { describe, expect, it } from "vitest";

import { isShotCroppedSectionOfInputVideo } from "./isShotCroppedSectionOfInputVideo";

describe("isShotCroppedSectionOfInputVideo", () => {
  it("returns false when the crop is undefined", () => {
    expect(isShotCroppedSectionOfInputVideo({ crop: undefined })).toBe(false);
  });

  it("returns false for a zero-area crop", () => {
    expect(
      isShotCroppedSectionOfInputVideo({
        crop: { x: 0.5, y: 0, width: 0, height: 1 }
      })
    ).toBe(false);
  });

  it("returns false for a full-frame crop", () => {
    expect(
      isShotCroppedSectionOfInputVideo({
        crop: { x: 0, y: 0, width: 1, height: 1 }
      })
    ).toBe(false);
  });

  it("returns true for a positive-area, non-full-frame crop", () => {
    expect(
      isShotCroppedSectionOfInputVideo({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 }
      })
    ).toBe(true);
  });
});
