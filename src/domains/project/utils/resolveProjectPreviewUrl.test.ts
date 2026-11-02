import { describe, expect, it } from "vitest";

import { resolveProjectPreviewUrl } from "./resolveProjectPreviewUrl";

describe("resolveProjectPreviewUrl", () => {
  it("keeps the real preview when the project has one", () => {
    expect(
      resolveProjectPreviewUrl("project-1", "https://example.com/thumb.jpg")
    ).toBe("https://example.com/thumb.jpg");
  });

  it("falls back to a gradient when the preview is missing", () => {
    expect(resolveProjectPreviewUrl("project-1", null)).toMatch(
      /^\/project-gradients\/mesh-0[1-5]-[a-z-]+\.png$/
    );
    expect(resolveProjectPreviewUrl("project-1", undefined)).toMatch(
      /^\/project-gradients\//
    );
  });

  it("treats an empty preview as missing", () => {
    expect(resolveProjectPreviewUrl("project-1", "")).toMatch(
      /^\/project-gradients\//
    );
  });

  it("gives one project the same gradient every time", () => {
    expect(resolveProjectPreviewUrl("project-1", null)).toBe(
      resolveProjectPreviewUrl("project-1", null)
    );
  });

  it("spreads different projects across all five gradients", () => {
    const chosen = new Set(
      ["a", "b", "c", "d", "e"].map((id) => resolveProjectPreviewUrl(id, null))
    );

    expect(chosen.size).toBe(5);
  });
});
