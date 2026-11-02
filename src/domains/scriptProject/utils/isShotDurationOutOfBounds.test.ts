import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isShotDurationOutOfBounds } from "./isShotDurationOutOfBounds";

const shot = (durationSeconds: number | null): ShotState =>
  ({ duration_s: durationSeconds }) as unknown as ShotState;

const PROJECT_SHOT_FRAMES_WITHIN_BOUNDS = 124;

describe("isShotDurationOutOfBounds", () => {
  it("flags a legacy Shot shorter than the window", () => {
    expect(
      isShotDurationOutOfBounds(shot(3), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(true);
  });

  it("flags a Shot longer than the window", () => {
    expect(
      isShotDurationOutOfBounds(shot(20), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(true);
  });

  it("does not flag a Shot inside the window", () => {
    expect(
      isShotDurationOutOfBounds(shot(8), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(false);
  });

  it("does not flag a Shot exactly on a bound", () => {
    expect(
      isShotDurationOutOfBounds(shot(5), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(false);
    expect(
      isShotDurationOutOfBounds(shot(15), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(false);
  });

  it("falls back to the project-wide length when the Shot has none of its own", () => {
    expect(
      isShotDurationOutOfBounds(shot(null), PROJECT_SHOT_FRAMES_WITHIN_BOUNDS)
    ).toBe(false);

    const PROJECT_SHOT_FRAMES_OUT_OF_BOUNDS = 22;
    expect(
      isShotDurationOutOfBounds(shot(null), PROJECT_SHOT_FRAMES_OUT_OF_BOUNDS)
    ).toBe(true);
  });
});
