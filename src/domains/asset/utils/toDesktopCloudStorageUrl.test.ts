import { describe, expect, it } from "vitest";

import {
  DESKTOP_CLOUD_STORAGE_URL_PREFIX,
  toDesktopCloudStorageUrl
} from "./toDesktopCloudStorageUrl";

const PRESIGNED_URL =
  "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/user/asset/video.mp4?X-Amz-Signature=abc&X-Amz-Expires=3600";

describe("toDesktopCloudStorageUrl", () => {
  it("routes a regional presigned S3 URL through the desktop media protocol", () => {
    const desktopUrl = toDesktopCloudStorageUrl(PRESIGNED_URL);

    expect(desktopUrl).toBe(
      `${DESKTOP_CLOUD_STORAGE_URL_PREFIX}${encodeURIComponent(PRESIGNED_URL)}`
    );
    expect(new URL(desktopUrl).searchParams.get("url")).toBe(PRESIGNED_URL);
  });

  it("routes a global-endpoint presigned S3 URL too", () => {
    const globalUrl =
      "https://mago-s3-prod.s3.amazonaws.com/a/images.zip?sig=1";

    expect(toDesktopCloudStorageUrl(globalUrl)).toBe(
      `${DESKTOP_CLOUD_STORAGE_URL_PREFIX}${encodeURIComponent(globalUrl)}`
    );
  });

  it.each([
    "mago-media://asset/asset-1",
    "blob:https://desktop.app.mago.studio/abc",
    "data:image/png;base64,abc",
    "https://img.clerk.com/avatar.png",
    "https://cdn.example.com/sheet.png",
    "http://mago-s3-prod.s3.amazonaws.com/a.png",
    "https://amazonaws.com.evil.example/a.png",
    "https://mago-s3-prod.s3.amazonaws.com.evil.example/a.png",
    "not a url"
  ])("leaves %s untouched", (url) => {
    expect(toDesktopCloudStorageUrl(url)).toBe(url);
  });
});
