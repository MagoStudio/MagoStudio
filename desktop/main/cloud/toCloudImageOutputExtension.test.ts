import { describe, expect, test } from "vitest";

import { toCloudImageOutputExtension } from "./toCloudImageOutputExtension";

describe("toCloudImageOutputExtension", () => {
  test("takes the extension of the file the cloud delivered", () => {
    expect(
      toCloudImageOutputExtension(
        "https://bucket.s3.amazonaws.com/renders/output.JPG?X-Amz-Signature=abc.png",
        "png"
      )
    ).toBe("jpg");
  });

  test("falls back when the url names no image file", () => {
    expect(
      toCloudImageOutputExtension(
        "https://bucket.s3.amazonaws.com/renders/output",
        "png"
      )
    ).toBe("png");
    expect(
      toCloudImageOutputExtension(
        "https://bucket.s3.amazonaws.com/output.exe",
        "png"
      )
    ).toBe("png");
    expect(toCloudImageOutputExtension("not a url", "png")).toBe("png");
  });
});
