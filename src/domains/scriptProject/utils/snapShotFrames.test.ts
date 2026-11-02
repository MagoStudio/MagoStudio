import { describe, expect, it } from "vitest";

import {
  framesToSeconds,
  snapShotFrames,
  snapShotSecondsToFrames
} from "./snapShotFrames";

describe("snapShotFrames", () => {
  it("keeps a count already on the grid", () => {
    expect(snapShotFrames(5)).toBe(5);
    expect(snapShotFrames(22)).toBe(22);
    expect(snapShotFrames(56)).toBe(56);
  });

  it("rounds up to the next count the engine can generate", () => {
    expect(snapShotFrames(6)).toBe(22);
    expect(snapShotFrames(40)).toBe(56);
    expect(snapShotFrames(57)).toBe(73);
  });

  it("floors at the shortest clip the engine makes", () => {
    expect(snapShotFrames(1)).toBe(5);
    expect(snapShotFrames(0)).toBe(5);
    expect(snapShotFrames(-10)).toBe(5);
  });

  it("clamps at the engine ceiling rather than asking for more", () => {
    expect(snapShotFrames(99999)).toBe(3592);
  });

  it("every result sits on the 5 + 17k grid", () => {
    for (let wanted = 1; wanted <= 400; wanted += 1) {
      expect((snapShotFrames(wanted) - 5) % 17).toBe(0);
    }
  });
});

describe("snapShotSecondsToFrames", () => {
  it("converts at 24fps and snaps up", () => {
    expect(snapShotSecondsToFrames(2)).toBe(56);
    expect(snapShotSecondsToFrames(3)).toBe(73);
    expect(snapShotSecondsToFrames(5)).toBe(124);
  });
});

describe("framesToSeconds", () => {
  it("reports the length actually delivered, not the one requested", () => {
    expect(framesToSeconds(56)).toBeCloseTo(2.33, 2);
    expect(framesToSeconds(73)).toBeCloseTo(3.04, 2);
  });
});
