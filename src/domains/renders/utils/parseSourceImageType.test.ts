import { describe, expect, it } from "vitest";

import { parseSourceImageType } from "./parseSourceImageType";

describe("parseSourceImageType", () => {
  it("returns the value when it is a known SourceImageType", () => {
    expect(parseSourceImageType("element_reference", "key_frame")).toBe(
      "element_reference"
    );
  });

  it.each([
    "reference_frame",
    "key_frame",
    "element_reference",
    "element_frontal",
    "motion_reference",
    "style_reference"
  ])("accepts %s", (role) => {
    expect(parseSourceImageType(role, "key_frame")).toBe(role);
  });

  it("falls back when the value is undefined", () => {
    expect(parseSourceImageType(undefined, "key_frame")).toBe("key_frame");
  });

  it("falls back when the value is a typo'd/unknown role", () => {
    expect(parseSourceImageType("keyframe", "key_frame")).toBe("key_frame");
  });

  it("falls back for a non-string value", () => {
    expect(parseSourceImageType(42, "reference_frame")).toBe("reference_frame");
  });
});
