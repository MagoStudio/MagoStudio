import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useCachedImageUrl = vi.hoisted(() => vi.fn());
vi.mock("./data/useCachedImageUrl", () => ({ useCachedImageUrl }));

import { useCachedOrProxiedImageUrl } from "./useCachedOrProxiedImageUrl";

const STORYBOARD_OBJECT_URL =
  "https://mago-assets.s3.us-east-1.amazonaws.com/storyboard.png?X-Amz-Signature=abc";

describe("useCachedOrProxiedImageUrl", () => {
  beforeEach(() => {
    useCachedImageUrl.mockReset().mockReturnValue(undefined);
  });

  it("shows the cached copy once the image is cached under its asset id", () => {
    useCachedImageUrl.mockReturnValue("blob:cached-storyboard");
    const { result } = renderHook(() =>
      useCachedOrProxiedImageUrl(STORYBOARD_OBJECT_URL, "storyboard-asset")
    );
    expect(result.current).toBe("blob:cached-storyboard");
    expect(useCachedImageUrl).toHaveBeenCalledWith(
      STORYBOARD_OBJECT_URL,
      "storyboard-asset",
      true
    );
  });

  it("loads the image through the desktop media proxy until it is cached", () => {
    const { result } = renderHook(() =>
      useCachedOrProxiedImageUrl(STORYBOARD_OBJECT_URL, "storyboard-asset")
    );
    expect(result.current).toBe(
      `mago-media://cloud-storage/?url=${encodeURIComponent(STORYBOARD_OBJECT_URL)}`
    );
  });

  it("skips the cache for an image without an asset id", () => {
    renderHook(() =>
      useCachedOrProxiedImageUrl(STORYBOARD_OBJECT_URL, undefined)
    );
    expect(useCachedImageUrl).toHaveBeenCalledWith(
      STORYBOARD_OBJECT_URL,
      "",
      false
    );
  });
});
