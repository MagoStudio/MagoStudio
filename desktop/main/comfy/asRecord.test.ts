import { describe, expect, it } from "vitest";

import { asRecord } from "./asRecord";

describe("asRecord", () => {
  it("returns plain objects", () => {
    const value = { a: 1 };
    expect(asRecord(value)).toBe(value);
  });

  it("rejects arrays, null and primitives", () => {
    expect(asRecord([1])).toBeNull();
    expect(asRecord(null)).toBeNull();
    expect(asRecord("text")).toBeNull();
    expect(asRecord(3)).toBeNull();
  });
});
