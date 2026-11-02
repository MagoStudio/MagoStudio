import { describe, expect, it } from "vitest";

import { readOutputSize } from "./readOutputSize";

describe("readOutputSize", () => {
  it("reads a width and height pair", () => {
    expect(readOutputSize({ output_size: [1280, 720] })).toEqual([1280, 720]);
  });

  it.each([
    ["missing spec", null],
    ["missing field", {}],
    ["wrong length", { output_size: [1280] }],
    ["zero edge", { output_size: [0, 720] }],
    ["non-number edge", { output_size: ["1280", 720] }],
    ["infinite edge", { output_size: [Infinity, 720] }]
  ])("returns null for %s", (_caseName, renderSpec) => {
    expect(readOutputSize(renderSpec)).toBeNull();
  });
});
