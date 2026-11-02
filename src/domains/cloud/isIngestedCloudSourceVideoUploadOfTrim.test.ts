import { describe, expect, it } from "vitest";

import { isIngestedCloudSourceVideoUploadOfTrim } from "./isIngestedCloudSourceVideoUploadOfTrim";

describe("isIngestedCloudSourceVideoUploadOfTrim", () => {
  it("reuses an ingested upload of the same trim", () => {
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { status: "ingested", sourceVideoTrimKey: "1000-3000" } },
        "1000-3000"
      )
    ).toBe(true);
  });

  it("never reuses an upload of a different trim", () => {
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { status: "ingested", sourceVideoTrimKey: "1000-3000" } },
        "5000-9000"
      )
    ).toBe(false);
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { status: "ingested", sourceVideoTrimKey: "full" } },
        "1000-3000"
      )
    ).toBe(false);
  });

  it("reads a link from before the trim was keyed as an untrimmed upload", () => {
    const linkFromBeforeTrimWasKeyed = { data: { status: "ingested" } };

    expect(
      isIngestedCloudSourceVideoUploadOfTrim(linkFromBeforeTrimWasKeyed, "full")
    ).toBe(true);
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        linkFromBeforeTrimWasKeyed,
        "1000-3000"
      )
    ).toBe(false);
  });

  it("does not reuse an upload that has not finished ingesting", () => {
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { status: "processing", sourceVideoTrimKey: "full" } },
        "full"
      )
    ).toBe(false);
  });

  it("does not reuse a link whose trim key is unreadable", () => {
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { status: "ingested", sourceVideoTrimKey: 42 } },
        "full"
      )
    ).toBe(false);
  });

  it("does not vouch for a cloud-origin link, which carries no upload status", () => {
    expect(
      isIngestedCloudSourceVideoUploadOfTrim(
        { data: { origin: "cloud" } },
        "1000-3000"
      )
    ).toBe(false);
  });

  it("has nothing to reuse without a link", () => {
    expect(isIngestedCloudSourceVideoUploadOfTrim(null, "full")).toBe(false);
  });
});
