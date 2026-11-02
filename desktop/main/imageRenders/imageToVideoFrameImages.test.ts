import { describe, expect, it } from "vitest";

import { readImageToVideoFrameImageIds } from "./imageToVideoFrameImages";

describe("readImageToVideoFrameImageIds", () => {
  it("reads the start and optional end frame", () => {
    expect(
      readImageToVideoFrameImageIds({ image_id: "start", end_image_id: "end" })
    ).toEqual({ startImageAssetId: "start", endImageAssetId: "end" });
    expect(
      readImageToVideoFrameImageIds({ image_id: "start", end_image_id: "" })
    ).toEqual({ startImageAssetId: "start" });
  });

  it("rejects a render with no start image", () => {
    expect(() => readImageToVideoFrameImageIds({ image_id: " " })).toThrow(
      "Image-to-Video renders need a start image"
    );
    expect(() => readImageToVideoFrameImageIds({})).toThrow(
      "Image-to-Video renders need a start image"
    );
  });
});
