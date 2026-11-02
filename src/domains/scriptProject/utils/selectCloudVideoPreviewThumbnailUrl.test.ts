import { describe, expect, it } from "vitest";

import { selectCloudVideoPreviewThumbnailUrl } from "./selectCloudVideoPreviewThumbnailUrl";

const filmstrip = { s3_url: "https://cdn.example/strip.jpg", height: 65 };
const singleFrame = {
  s3_url: "https://cdn.example/single.jpg",
  single_frame: 1,
  height: 65
};
const firstFrame = {
  s3_url: "https://cdn.example/first.jpg",
  first_frame: true,
  width: 512
};

describe("selectCloudVideoPreviewThumbnailUrl", () => {
  it("prefers the full-width first frame over filmstrips listed before it", () => {
    expect(
      selectCloudVideoPreviewThumbnailUrl([filmstrip, singleFrame, firstFrame])
    ).toBe("https://cdn.example/first.jpg");
  });

  it("falls back to the single frame, then to any signed thumbnail", () => {
    expect(selectCloudVideoPreviewThumbnailUrl([filmstrip, singleFrame])).toBe(
      "https://cdn.example/single.jpg"
    );
    expect(selectCloudVideoPreviewThumbnailUrl([filmstrip])).toBe(
      "https://cdn.example/strip.jpg"
    );
  });

  it("skips thumbnails without a signed HTTPS URL", () => {
    expect(
      selectCloudVideoPreviewThumbnailUrl([
        { first_frame: true, s3_url: null },
        filmstrip
      ])
    ).toBe("https://cdn.example/strip.jpg");
    expect(selectCloudVideoPreviewThumbnailUrl([])).toBeUndefined();
  });
});
