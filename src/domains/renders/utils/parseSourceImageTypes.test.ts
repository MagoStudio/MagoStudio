import { describe, expect, it } from "vitest";

import { parseSourceImageTypes } from "./parseSourceImageTypes";

describe("parseSourceImageTypes", () => {
  it("returns the declared roles when every entry is a known source image type", () => {
    expect(
      parseSourceImageTypes(["element_reference", "element_frontal"])
    ).toEqual(["element_reference", "element_frontal"]);
  });

  it("drops entries that are not known source image types", () => {
    expect(parseSourceImageTypes(["key_frame", "not_a_role", 7, null])).toEqual(
      ["key_frame"]
    );
  });

  it("returns an empty array for a non-array value", () => {
    expect(parseSourceImageTypes(undefined)).toEqual([]);
    expect(parseSourceImageTypes("key_frame")).toEqual([]);
    expect(parseSourceImageTypes({ role: "key_frame" })).toEqual([]);
  });
});
