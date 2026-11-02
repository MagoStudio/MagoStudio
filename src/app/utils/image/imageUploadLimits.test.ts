import { describe, expect, it } from "vitest";

import { getImageLimitErrorKey } from "./imageUploadLimits";

const fileOfSize = (sizeBytes: number): File => {
  const file = new File([""], "test.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
};

const validDimensions = { width: 1920, height: 1080 };

describe("getImageLimitErrorKey", () => {
  it("accepts a file of exactly 50000000 bytes", () => {
    expect(
      getImageLimitErrorKey(fileOfSize(50000000), validDimensions)
    ).toBeNull();
  });

  it("rejects a file of 50000001 bytes as too big", () => {
    expect(getImageLimitErrorKey(fileOfSize(50000001), validDimensions)).toBe(
      "upload_button_image_input_too_big"
    );
  });

  it("rejects an image wider than 5600px as too big", () => {
    expect(
      getImageLimitErrorKey(fileOfSize(1000), { width: 5601, height: 1080 })
    ).toBe("upload_button_image_input_too_big");
  });

  it("rejects an image smaller than 300px as too small", () => {
    expect(
      getImageLimitErrorKey(fileOfSize(1000), { width: 299, height: 1080 })
    ).toBe("upload_button_image_input_too_small");
  });
});
