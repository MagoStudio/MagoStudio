import { describe, expect, it } from "vitest";

import { withImageExtensionMatchingContentType } from "./withImageExtensionMatchingContentType";

describe("withImageExtensionMatchingContentType", () => {
  it("renames a .jpg download whose bytes are png", () => {
    expect(
      withImageExtensionMatchingContentType("frame_3_1.jpg", "image/png")
    ).toBe("frame_3_1.png");
  });

  it("keeps a name that already matches its content type", () => {
    expect(
      withImageExtensionMatchingContentType("frame_3_1.jpg", "image/jpeg")
    ).toBe("frame_3_1.jpg");
  });

  it("keeps the name when the content type is not an image", () => {
    expect(withImageExtensionMatchingContentType("clip.mp4", "video/mp4")).toBe(
      "clip.mp4"
    );
  });

  it("keeps a non-image name even for an image content type", () => {
    expect(withImageExtensionMatchingContentType("clip.mp4", "image/png")).toBe(
      "clip.mp4"
    );
  });
});
