import { describe, it, expect } from "vitest";

import { toOutputFrame } from "./toOutputFrame";
import { toSeconds } from "./toSeconds";

describe("toSeconds", () => {
  it("divides an output frame by fps", () => {
    expect(toSeconds({ outputFrame: 30, fps: 30 })).toBe(1);
  });

  it("returns 0 at output frame 0", () => {
    expect(toSeconds({ outputFrame: 0, fps: 24 })).toBe(0);
  });

  it("matches the pre-refactor (sourceFrame - offset) / fps composition", () => {
    const sourceFrame = 45;
    const offset = 15;
    const fps = 30;

    const composed = toSeconds({
      outputFrame: toOutputFrame({ sourceFrame, offset }),
      fps
    });

    expect(composed).toBe((sourceFrame - offset) / fps);
  });
});
