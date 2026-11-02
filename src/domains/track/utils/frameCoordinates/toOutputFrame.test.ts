import { describe, it, expect } from "vitest";

import { toOutputFrame } from "./toOutputFrame";

describe("toOutputFrame", () => {
  it("subtracts the offset from a source frame inside the range", () => {
    expect(toOutputFrame({ sourceFrame: 35, offset: 20 })).toBe(15);
  });

  it("maps the range start to output frame 0", () => {
    expect(toOutputFrame({ sourceFrame: 20, offset: 20 })).toBe(0);
  });

  it("is identity when the offset is 0", () => {
    expect(toOutputFrame({ sourceFrame: 42, offset: 0 })).toBe(42);
  });

  it("clamps to 0 when the source frame is before the range start", () => {
    expect(toOutputFrame({ sourceFrame: 10, offset: 50 })).toBe(0);
  });
});
