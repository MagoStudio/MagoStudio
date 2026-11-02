import { describe, expect, it } from "vitest";

import { pickProjectCoverImageUrl } from "./pickProjectCoverImageUrl";

describe("pickProjectCoverImageUrl", () => {
  it("prefers the video preview", () => {
    expect(
      pickProjectCoverImageUrl({
        preview_url: "https://example.com/frame.jpg",
        sheet_preview_urls: ["https://example.com/sheet.jpg"]
      })
    ).toBe("https://example.com/frame.jpg");
  });

  it("falls back to the first sheet image a Script project has", () => {
    expect(
      pickProjectCoverImageUrl({
        preview_url: null,
        sheet_preview_urls: [null, "https://example.com/sheet.jpg"]
      })
    ).toBe("https://example.com/sheet.jpg");
  });

  it("has no cover when the project has no image at all", () => {
    expect(
      pickProjectCoverImageUrl({ preview_url: null, sheet_preview_urls: [] })
    ).toBeNull();
    expect(pickProjectCoverImageUrl({ preview_url: null })).toBeNull();
  });
});
