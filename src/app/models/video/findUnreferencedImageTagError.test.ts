import { describe, expect, it } from "vitest";

import { findUnreferencedImageTagError } from "./findUnreferencedImageTagError";

describe("findUnreferencedImageTagError", () => {
  it("flags a filled image slot that the prompt never references", () => {
    expect(findUnreferencedImageTagError("a cat", ["img-1"], 2)).toBe(
      "Add @Image1 to your prompt or remove the image"
    );
  });

  it("flags a filled higher slot that the prompt never references", () => {
    expect(
      findUnreferencedImageTagError("a cat @Image1", ["img-1", "img-2"], 9)
    ).toBe("Add @Image2 to your prompt or remove the image");
  });

  it("returns the lowest unreferenced slot first", () => {
    expect(findUnreferencedImageTagError("a cat", ["img-1", "img-2"], 5)).toBe(
      "Add @Image1 to your prompt or remove the image"
    );
  });

  it("accepts a referenced slot regardless of tag casing", () => {
    expect(findUnreferencedImageTagError("a cat @image1", ["img-1"], 2)).toBe(
      null
    );
    expect(findUnreferencedImageTagError("a cat @IMAGE1", ["img-1"], 2)).toBe(
      null
    );
  });

  it("ignores empty slots so it never fires on an unused uploader", () => {
    expect(findUnreferencedImageTagError("a cat", [], 5)).toBe(null);
    expect(
      findUnreferencedImageTagError("a cat @Image2", [undefined, "img-2"], 5)
    ).toBe(null);
  });

  it("ignores slots beyond the model's maximum", () => {
    expect(
      findUnreferencedImageTagError("a cat @Image1", ["img-1", "img-2"], 1)
    ).toBe(null);
  });
});
