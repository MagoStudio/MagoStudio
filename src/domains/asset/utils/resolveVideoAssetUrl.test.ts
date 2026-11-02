import { VideoAssetResponse } from "@domains/asset/api/interface";
import { describe, expect, it } from "vitest";

import { resolveVideoAssetUrl } from "./resolveVideoAssetUrl";

describe("resolveVideoAssetUrl", () => {
  it("returns null for undefined", () => {
    expect(resolveVideoAssetUrl(undefined)).toBeNull();
  });

  it("prefers urlToUse when present and truthy", () => {
    const asset = {
      s3_url: "https://example.com/s3.mp4",
      urlToUse: "blob:cached-url",
      asset: {}
    } as unknown as VideoAssetResponse;

    expect(resolveVideoAssetUrl(asset)).toBe("blob:cached-url");
  });

  it("falls back to s3_url when urlToUse is empty", () => {
    const asset = {
      s3_url: "https://example.com/s3.mp4",
      urlToUse: "",
      asset: {}
    } as unknown as VideoAssetResponse;

    expect(resolveVideoAssetUrl(asset)).toBe("https://example.com/s3.mp4");
  });

  it("returns null when neither urlToUse nor s3_url is present", () => {
    const asset = { error_type: "boom", error_message: "boom" };

    expect(resolveVideoAssetUrl(asset)).toBeNull();
  });

  it("returns null when both urlToUse and s3_url are empty", () => {
    const asset = {
      s3_url: "",
      urlToUse: "",
      asset: {}
    } as unknown as VideoAssetResponse;

    expect(resolveVideoAssetUrl(asset)).toBeNull();
  });
});
