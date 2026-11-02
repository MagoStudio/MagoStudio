import { describe, expect, it } from "vitest";

import { formatMetricRows } from "./formatMetricRows";

describe("formatMetricRows", () => {
  it("emits a row for each primitive value", () => {
    expect(formatMetricRows({ score: 0.9, passed: true, label: "ok" })).toEqual(
      [
        { label: "score", value: "0.9" },
        { label: "passed", value: "true" },
        { label: "label", value: "ok" }
      ]
    );
  });

  it("joins non-empty arrays into a comma-separated string", () => {
    expect(formatMetricRows({ tags: ["a", "b", "c"] })).toEqual([
      { label: "tags", value: "a, b, c" }
    ]);
  });

  it("skips empty arrays", () => {
    expect(formatMetricRows({ empty: [] })).toEqual([]);
  });

  it("reads the message field from error-like objects", () => {
    expect(formatMetricRows({ err: { message: "timeout" } })).toEqual([
      { label: "err", value: "timeout" }
    ]);
  });

  it("skips null, undefined, and plain objects without message", () => {
    expect(formatMetricRows({ a: null, b: undefined, c: { x: 1 } })).toEqual(
      []
    );
  });
});
