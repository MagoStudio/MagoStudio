import { describe, it, expect } from "vitest";

import { toOutputFrame } from "./toOutputFrame";
import { toSourceFrame } from "./toSourceFrame";

describe("toSourceFrame", () => {
  it("adds the offset to an output frame", () => {
    expect(toSourceFrame({ outputFrame: 15, offset: 20 })).toBe(35);
  });

  it("maps output frame 0 to the range start", () => {
    expect(toSourceFrame({ outputFrame: 0, offset: 20 })).toBe(20);
  });

  it("round-trips with toOutputFrame", () => {
    const sourceFrame = 35;
    const offset = 20;
    const outputFrame = toOutputFrame({ sourceFrame, offset });

    expect(toSourceFrame({ outputFrame, offset })).toBe(sourceFrame);
  });
});
