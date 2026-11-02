import { describe, expect, it } from "vitest";

import { isLocalVideoUrl } from "./isLocalVideoUrl";

describe("isLocalVideoUrl", () => {
  it.each([
    "mago-media://asset/video-1",
    "mago-media://script-project/video-1"
  ])("recognizes a disk video: %s", (url) => {
    expect(isLocalVideoUrl(url)).toBe(true);
  });
  it.each([
    undefined,
    null,
    "",
    "invalid",
    "https://cdn.example/video.mp4",
    "mago-media://cloud-storage/?url=https%3A%2F%2Fcdn.example%2Fvideo.mp4",
    "mago-media://thumbnail/video-1"
  ])(
    "does not mistake a remote proxy or thumbnail for a disk video: %s",
    (url) => {
      expect(isLocalVideoUrl(url)).toBe(false);
    }
  );
});
