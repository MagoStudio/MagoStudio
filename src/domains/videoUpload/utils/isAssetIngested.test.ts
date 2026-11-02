import { describe, expect, it } from "vitest";

import { VideoAssetResponse } from "../../asset/interface";

import { isAssetIngested } from "./isAssetIngested";

const buildAssetResponse = (status: string | undefined): VideoAssetResponse =>
  ({
    s3_url: "https://example.test/asset.mp4",
    urlToUse: "https://example.test/asset.mp4",
    asset: { data: { status } }
  }) as unknown as VideoAssetResponse;

describe("isAssetIngested", () => {
  it("is true only for the ingested status", () => {
    expect(isAssetIngested(buildAssetResponse("ingested"))).toBe(true);
  });

  it.each(["created", "not_ingested", "processing"])(
    "is false while the asset status is %s",
    (status) => {
      expect(isAssetIngested(buildAssetResponse(status))).toBe(false);
    }
  );

  it("is false when the status is absent", () => {
    expect(isAssetIngested(buildAssetResponse(undefined))).toBe(false);
  });

  it("is false for an undefined response", () => {
    expect(isAssetIngested(undefined)).toBe(false);
  });

  it("is false for a pending response carrying no asset", () => {
    expect(isAssetIngested({ status: "pending" })).toBe(false);
  });

  it("is false for an error response carrying no asset", () => {
    expect(
      isAssetIngested({ error_type: "ingestion", error_message: "boom" })
    ).toBe(false);
  });
});
