import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotVideoResultTileImageUrl } from "./resolveBulkRendersRunShotVideoResultTileImageUrl";

const SHOT_PREVIEW_URL = "https://example.test/shot-input-first-frame.jpg";
const VIDEO_RESULT_FRAME_URL = "data:image/jpeg;base64,render-frame";

describe("resolveBulkRendersRunShotVideoResultTileImageUrl", () => {
  it("shows the Shot preview before the Video step starts, matching the Original chip", () => {
    const imageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
      cardState: "pending",
      shotPreviewUrl: SHOT_PREVIEW_URL,
      videoResultFrameUrl: undefined
    });

    expect(imageUrl).toBe(SHOT_PREVIEW_URL);
  });

  it("shows the render frame once the Video step is done, matching the Result chip", () => {
    const imageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
      cardState: "ready",
      shotPreviewUrl: SHOT_PREVIEW_URL,
      videoResultFrameUrl: VIDEO_RESULT_FRAME_URL
    });

    expect(imageUrl).toBe(VIDEO_RESULT_FRAME_URL);
  });

  it("never falls back to the Shot preview once done, because that would show the input under a Result chip", () => {
    const imageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
      cardState: "ready",
      shotPreviewUrl: SHOT_PREVIEW_URL,
      videoResultFrameUrl: undefined
    });

    expect(imageUrl).toBeUndefined();
  });

  it("shows nothing while rendering, so the placeholder glyph is visible", () => {
    const imageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
      cardState: "rendering",
      shotPreviewUrl: SHOT_PREVIEW_URL,
      videoResultFrameUrl: VIDEO_RESULT_FRAME_URL
    });

    expect(imageUrl).toBeUndefined();
  });

  it.each(["qualityFailure", "infrastructureFailure"] as const)(
    "shows nothing on %s, so the error content is visible",
    (cardState) => {
      const imageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
        cardState,
        shotPreviewUrl: SHOT_PREVIEW_URL,
        videoResultFrameUrl: VIDEO_RESULT_FRAME_URL
      });

      expect(imageUrl).toBeUndefined();
    }
  );
});
