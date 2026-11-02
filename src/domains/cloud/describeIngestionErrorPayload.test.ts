import { describe, expect, it } from "vitest";

import { describeIngestionErrorPayload } from "./describeIngestionErrorPayload";

describe("describeIngestionErrorPayload", () => {
  it("passes a plain message through", () => {
    expect(describeIngestionErrorPayload("Unsupported video codec")).toBe(
      "Unsupported video codec"
    );
  });

  it("reads the reason out of the ingestion error object", () => {
    expect(
      describeIngestionErrorPayload({ message: "Video has no frames" })
    ).toBe("Video has no frames");
    expect(
      describeIngestionErrorPayload({ error: { detail: "Corrupt header" } })
    ).toBe("Corrupt header");
  });

  it("shows an unrecognised object rather than [object Object]", () => {
    expect(describeIngestionErrorPayload({ code: 7 })).toBe('{"code":7}');
  });

  it("falls back to a generic message when there is nothing to show", () => {
    expect(describeIngestionErrorPayload(undefined)).toBe(
      "Cloud ingestion failed for this video"
    );
    expect(describeIngestionErrorPayload({})).toBe(
      "Cloud ingestion failed for this video"
    );
    expect(describeIngestionErrorPayload("  ")).toBe(
      "Cloud ingestion failed for this video"
    );
  });
});
