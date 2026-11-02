import { describe, expect, it } from "vitest";

import { buildRenderCacheKey } from "./buildRenderCacheKey";

describe("buildRenderCacheKey", () => {
  it("returns the asset id when there is no signed url", () => {
    expect(buildRenderCacheKey("asset-1")).toBe("asset-1");
    expect(buildRenderCacheKey("asset-1", null)).toBe("asset-1");
  });

  it("ignores the signature so a refreshed url keeps the same key", () => {
    const first = buildRenderCacheKey(
      "asset-1",
      "https://cdn.example.com/renders/a.mp4?sig=one"
    );
    const second = buildRenderCacheKey(
      "asset-1",
      "https://cdn.example.com/renders/a.mp4?sig=two"
    );
    expect(first).toBe(second);
  });

  it("changes when a re-render lands at a new path", () => {
    const first = buildRenderCacheKey(
      "asset-1",
      "https://cdn.example.com/renders/a.mp4?sig=one"
    );
    const second = buildRenderCacheKey(
      "asset-1",
      "https://cdn.example.com/renders/b.mp4?sig=one"
    );
    expect(first).not.toBe(second);
  });

  it("falls back to the asset id for an unparseable url", () => {
    expect(buildRenderCacheKey("asset-1", "not a url")).toBe("asset-1");
  });
});
