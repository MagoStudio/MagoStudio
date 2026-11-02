import { describe, expect, it } from "vitest";

import { resolveSceneCardPreviewMiddlePx } from "./resolveSceneCardPreviewMiddlePx";

describe("resolveSceneCardPreviewMiddlePx", () => {
  it("finds the middle of a landscape preview under the card header", () => {
    expect(resolveSceneCardPreviewMiddlePx([1280, 720])).toBe(168);
  });

  it("caps a portrait preview at its maximum height", () => {
    expect(resolveSceneCardPreviewMiddlePx([720, 1280])).toBe(364);
  });

  it("treats an unusable size as a square preview", () => {
    expect(resolveSceneCardPreviewMiddlePx([0, 0])).toBe(256);
  });
});
