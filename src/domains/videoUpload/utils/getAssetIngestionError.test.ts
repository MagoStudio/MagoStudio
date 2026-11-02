import { describe, expect, it } from "vitest";

import { VideoAssetResponse } from "../../asset/interface";

import { getAssetIngestionError } from "./getAssetIngestionError";

describe("getAssetIngestionError", () => {
  it("returns the backend error message when present", () => {
    expect(
      getAssetIngestionError({
        error_type: "ingestion_failed",
        error_message: "Unsupported codec"
      })
    ).toBe("Unsupported codec");
  });

  it("returns undefined when the error message is empty", () => {
    expect(
      getAssetIngestionError({
        error_type: "ingestion_failed",
        error_message: ""
      })
    ).toBeUndefined();
  });

  it("returns undefined for a pending response", () => {
    expect(getAssetIngestionError({ status: "pending" })).toBeUndefined();
  });

  it("returns undefined for a successful response", () => {
    expect(
      getAssetIngestionError({
        s3_url: "https://example.test/asset.mp4",
        urlToUse: "https://example.test/asset.mp4",
        asset: { data: { status: "ingested" } }
      } as unknown as VideoAssetResponse)
    ).toBeUndefined();
  });

  it("returns undefined for an undefined response", () => {
    expect(getAssetIngestionError(undefined)).toBeUndefined();
  });
});
