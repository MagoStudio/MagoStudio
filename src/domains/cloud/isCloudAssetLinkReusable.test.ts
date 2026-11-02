import { describe, expect, it } from "vitest";

import { isCloudAssetLinkReusable } from "./isCloudAssetLinkReusable";

describe("isCloudAssetLinkReusable", () => {
  it("rejects a missing link", () => {
    expect(isCloudAssetLinkReusable(null)).toBe(false);
    expect(isCloudAssetLinkReusable(undefined)).toBe(false);
  });

  it("reuses an asset this app uploaded once ingestion finished", () => {
    expect(isCloudAssetLinkReusable({ data: { status: "ingested" } })).toBe(
      true
    );
  });

  it("resumes a half-finished upload rather than trusting it", () => {
    expect(isCloudAssetLinkReusable({ data: { status: "uploading" } })).toBe(
      false
    );
    expect(isCloudAssetLinkReusable({ data: { status: "stale" } })).toBe(false);
  });

  it("reuses an asset mirrored from a cloud project, whatever its status", () => {
    expect(isCloudAssetLinkReusable({ data: { origin: "cloud" } })).toBe(true);
  });
});
