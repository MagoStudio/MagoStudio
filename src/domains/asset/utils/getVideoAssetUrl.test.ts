import { describe, expect, it } from "vitest";

import { VideoAssetResponse } from "../api/interface";

import { getVideoAssetUrl } from "./getVideoAssetUrl";

describe("getVideoAssetUrl", () => {
  it("returns undefined when there is no video asset", () => {
    expect(getVideoAssetUrl(undefined)).toBeUndefined();
  });

  it("prefers the locally cached blob url over the remote url", () => {
    const videoAsset = {
      s3_url: "https://s3.example/video.mp4",
      urlToUse: "blob:https://app.example/abc",
      asset: {}
    } as unknown as VideoAssetResponse;

    expect(getVideoAssetUrl(videoAsset)).toBe("blob:https://app.example/abc");
  });

  it("falls back to the remote url when caching produced no blob url", () => {
    const videoAsset = {
      s3_url: "https://s3.example/video.mp4",
      urlToUse: "",
      asset: {}
    } as unknown as VideoAssetResponse;

    expect(getVideoAssetUrl(videoAsset)).toBe("https://s3.example/video.mp4");
  });

  it("returns undefined while the render has produced no video yet", () => {
    const videoAsset = { status: "pending" } as VideoAssetResponse;

    expect(getVideoAssetUrl(videoAsset)).toBeUndefined();
  });

  it("returns undefined for an asset response carrying an empty url", () => {
    const videoAsset = {
      s3_url: "",
      urlToUse: ""
    } as unknown as VideoAssetResponse;

    expect(getVideoAssetUrl(videoAsset)).toBeUndefined();
  });
});
