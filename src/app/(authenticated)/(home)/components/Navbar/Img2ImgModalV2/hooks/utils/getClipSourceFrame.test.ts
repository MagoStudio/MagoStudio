import { Clip } from "@schemas/clip";
import { describe, expect, it } from "vitest";

import { getClipSourceFrame } from "./getClipSourceFrame";

describe("getClipSourceFrame", () => {
  it("returns settings.frame when present", () => {
    const data = { settings: { frame: 20 } } as Clip["data"];
    expect(getClipSourceFrame(data)).toBe(20);
  });

  it("falls back to data.frame when settings.frame is missing (legacy clips)", () => {
    const data = { frame: 15 } as Clip["data"];
    expect(getClipSourceFrame(data)).toBe(15);
  });

  it("prefers settings.frame over data.frame when both exist", () => {
    const data = { frame: 15, settings: { frame: 20 } } as Clip["data"];
    expect(getClipSourceFrame(data)).toBe(20);
  });

  it("returns undefined when neither is present", () => {
    expect(getClipSourceFrame({} as Clip["data"])).toBeUndefined();
  });

  it("returns undefined for undefined data", () => {
    expect(getClipSourceFrame(undefined)).toBeUndefined();
  });

  it("returns 0 when settings.frame is 0 (not treated as falsy)", () => {
    const data = { frame: 15, settings: { frame: 0 } } as Clip["data"];
    expect(getClipSourceFrame(data)).toBe(0);
  });
});
