import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isPreviousListedShotThePredecessor } from "./isPreviousListedShotThePredecessor";

const buildShot = (timelineId: string): ShotState =>
  ({ timeline_id: timelineId }) as unknown as ShotState;

describe("isPreviousListedShotThePredecessor", () => {
  it("is true when the Shot on the left is the real predecessor", () => {
    const previous = buildShot("a");
    expect(
      isPreviousListedShotThePredecessor({
        previousListedShot: previous,
        predecessorShot: previous
      })
    ).toBe(true);
  });

  it("is false before the Shot that leads the project", () => {
    expect(
      isPreviousListedShotThePredecessor({
        previousListedShot: undefined,
        predecessorShot: undefined
      })
    ).toBe(false);
  });

  it("is false across a Shot a search filtered out", () => {
    expect(
      isPreviousListedShotThePredecessor({
        previousListedShot: buildShot("a"),
        predecessorShot: buildShot("b")
      })
    ).toBe(false);
  });
});
