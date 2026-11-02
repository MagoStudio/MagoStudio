import { describe, expect, it } from "vitest";

import { truncateByCodePoint } from "./truncateByCodePoint";

describe("truncateByCodePoint", () => {
  it("returns the value unchanged when it is within the limit", () => {
    expect(truncateByCodePoint("Bulk 1_My film", 200)).toBe("Bulk 1_My film");
  });

  it("truncates a plain ASCII string to the exact code point count", () => {
    expect(truncateByCodePoint("a".repeat(250), 200)).toBe("a".repeat(200));
  });

  it("never splits a surrogate pair, unlike a UTF-16-based slice", () => {
    const surrogatePairEmoji = "🎬";
    const oddLengthPrefix = "a";
    const value = oddLengthPrefix + surrogatePairEmoji.repeat(250);

    const truncated = truncateByCodePoint(value, 200);

    // oxlint-disable-next-line typescript/no-misused-spread -- asserting the code-point count is exactly the property under test
    expect([...truncated]).toHaveLength(200);
    expect(truncated).toBe(oddLengthPrefix + surrogatePairEmoji.repeat(199));
    expect(truncated).not.toBe(value.slice(0, 200));
  });

  it("returns an empty string when the limit is zero", () => {
    expect(truncateByCodePoint("anything", 0)).toBe("");
  });
});
