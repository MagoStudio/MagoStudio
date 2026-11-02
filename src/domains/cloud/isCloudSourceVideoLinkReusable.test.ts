import { describe, expect, it } from "vitest";

import { isCloudSourceVideoLinkReusable } from "./isCloudSourceVideoLinkReusable";

const requested = {
  sourceVideoTrimKey: "1000-3000",
  cloudTimelineId: "shot-timeline"
};

describe("isCloudSourceVideoLinkReusable", () => {
  it("reuses an ingested upload of the same trim on the shot's own cloud timeline", () => {
    expect(
      isCloudSourceVideoLinkReusable(
        {
          data: {
            status: "ingested",
            sourceVideoTrimKey: "1000-3000",
            cloudTimelineId: "shot-timeline"
          }
        },
        requested
      )
    ).toBe(true);
  });

  it("never reuses an upload that sits on another cloud timeline", () => {
    expect(
      isCloudSourceVideoLinkReusable(
        {
          data: {
            status: "ingested",
            sourceVideoTrimKey: "1000-3000",
            cloudTimelineId: "other-shot-timeline"
          }
        },
        requested
      )
    ).toBe(false);
  });

  it("never reuses a link that does not say which cloud timeline holds it", () => {
    expect(
      isCloudSourceVideoLinkReusable(
        { data: { status: "ingested", sourceVideoTrimKey: "1000-3000" } },
        requested
      )
    ).toBe(false);
  });

  it("never reuses an upload of a different trim", () => {
    expect(
      isCloudSourceVideoLinkReusable(
        {
          data: {
            status: "ingested",
            sourceVideoTrimKey: "5000-9000",
            cloudTimelineId: "shot-timeline"
          }
        },
        requested
      )
    ).toBe(false);
  });

  it("does not reuse an upload that has not finished ingesting", () => {
    expect(
      isCloudSourceVideoLinkReusable(
        {
          data: {
            status: "processing",
            sourceVideoTrimKey: "1000-3000",
            cloudTimelineId: "shot-timeline"
          }
        },
        requested
      )
    ).toBe(false);
  });

  it("always reuses a source that came from a cloud project", () => {
    expect(
      isCloudSourceVideoLinkReusable({ data: { origin: "cloud" } }, requested)
    ).toBe(true);
  });

  it("has nothing to reuse without a link", () => {
    expect(isCloudSourceVideoLinkReusable(null, requested)).toBe(false);
  });
});
