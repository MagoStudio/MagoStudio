import { describe, test, expect } from "vitest";

import { normalizeValue } from "./normalizeValue";

describe("normalizeValue", () => {
  test("returns strings unchanged", () => {
    expect(normalizeValue("uuid-123")).toBe("uuid-123");
  });

  test("unwraps deeply nested arrays", () => {
    expect(normalizeValue([[[["uuid-123"]]]])).toBe("uuid-123");
  });

  test("unwraps single-element array to string", () => {
    expect(normalizeValue(["uuid-123"])).toBe("uuid-123");
  });

  test("keeps single-element array for image_ids key", () => {
    expect(normalizeValue(["uuid-123"], "image_ids")).toEqual(["uuid-123"]);
  });

  test("keeps multi-element string arrays unchanged", () => {
    expect(normalizeValue(["id1", "id2"])).toEqual(["id1", "id2"]);
  });

  test("returns other values unchanged", () => {
    expect(normalizeValue(42)).toBe(42);
    expect(normalizeValue(null)).toBe(null);
  });
});
