import { describe, expect, it } from "vitest";

import { normalizeSourceVideoTrim } from "./normalizeSourceVideoTrim";

describe("normalizeSourceVideoTrim", () => {
  it("rounds both ends to whole milliseconds", () => {
    expect(
      normalizeSourceVideoTrim({
        trimStartSeconds: 1.00049,
        trimEndSeconds: 2.9996
      })
    ).toEqual({ trimStartSeconds: 1, trimEndSeconds: 3 });
  });

  it("drops a trim start at the very beginning of the source", () => {
    expect(
      normalizeSourceVideoTrim({ trimStartSeconds: 0.0004, trimEndSeconds: 4 })
    ).toEqual({ trimEndSeconds: 4 });
  });

  it("leaves an untrimmed source untrimmed", () => {
    expect(normalizeSourceVideoTrim({})).toEqual({});
  });

  it("keeps an open-ended trim open", () => {
    expect(normalizeSourceVideoTrim({ trimStartSeconds: 2.5 })).toEqual({
      trimStartSeconds: 2.5
    });
  });
});
