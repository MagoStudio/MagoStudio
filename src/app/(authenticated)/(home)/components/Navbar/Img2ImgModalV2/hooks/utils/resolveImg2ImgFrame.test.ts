import { describe, expect, it } from "vitest";

import { resolveImg2ImgFrame } from "./resolveImg2ImgFrame";

describe("resolveImg2ImgFrame", () => {
  it("returns the iterated source frame when iterating and source is defined", () => {
    expect(resolveImg2ImgFrame("asset-123", 20, 5)).toBe(20);
  });

  it("returns the playhead frame when iterating but source is undefined (legacy clip)", () => {
    expect(resolveImg2ImgFrame("asset-123", undefined, 5)).toBe(5);
  });

  it("returns 0 when iterating and source is 0 (treats 0 as a valid frame, not falsy)", () => {
    expect(resolveImg2ImgFrame("asset-123", 0, 42)).toBe(0);
  });

  it("ignores a stale iteratedSourceFrame when not iterating (guards against copy/paste leaks)", () => {
    expect(resolveImg2ImgFrame(undefined, 20, 5)).toBe(5);
  });

  it("returns the playhead frame when neither iterating nor source is set", () => {
    expect(resolveImg2ImgFrame(undefined, undefined, 5)).toBe(5);
  });

  it("treats empty-string iteratedAssetId as not iterating (consistent with truthy check elsewhere)", () => {
    expect(resolveImg2ImgFrame("", 20, 5)).toBe(5);
  });
});
