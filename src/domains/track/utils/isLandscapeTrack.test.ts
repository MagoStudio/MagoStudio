import { isLandscapeTrack } from "@domains/track/utils/isLandscapeTrack";
import { describe, expect, it } from "vitest";

describe("isLandscapeTrack", () => {
  it("returns true when asset.data.size is landscape", () => {
    expect(
      isLandscapeTrack({
        clips: [{ asset: { data: { size: [1920, 1080] } } }]
      } as any)
    ).toBe(true);
  });

  it("returns false when asset.data.size is portrait", () => {
    expect(
      isLandscapeTrack({
        clips: [{ asset: { data: { size: [1080, 1920] } } }]
      } as any)
    ).toBe(false);
  });

  it("falls back to width/height when size is missing", () => {
    expect(
      isLandscapeTrack({
        clips: [{ asset: { data: { width: 1920, height: 1080 } } }]
      } as any)
    ).toBe(true);
  });

  it("returns false when dimensions are missing/invalid", () => {
    expect(isLandscapeTrack(undefined)).toBe(false);
    expect(
      isLandscapeTrack({
        clips: [{ asset: { data: {} } }]
      } as any)
    ).toBe(false);
    expect(
      isLandscapeTrack({
        clips: [{ asset: { data: { size: [0, 1080] } } }]
      } as any)
    ).toBe(false);
  });
});
