import { describe, expect, it } from "vitest";

import { isSameQueryKey } from "./isSameQueryKey";

describe("isSameQueryKey", () => {
  it("matches keys with the same parts, whatever object key order", () => {
    expect(
      isSameQueryKey(["state", { b: 1, a: 2 }], ["state", { a: 2, b: 1 }])
    ).toBe(true);
  });

  it("tells a key apart from its prefix", () => {
    expect(isSameQueryKey(["state", "project"], ["state"])).toBe(false);
  });
});
