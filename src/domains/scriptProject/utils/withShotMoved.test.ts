import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { withShotMoved } from "./withShotMoved";

const shot = (timelineId: string, shotIndex: number) =>
  ({ timeline_id: timelineId, shot_index: shotIndex }) as ShotState;

const timelineIdsInTabOrder = (shots: ShotState[]) =>
  [...shots]
    .sort(
      (firstShot, secondShot) => firstShot.shot_index - secondShot.shot_index
    )
    .map((movedShot) => movedShot.timeline_id);

describe("withShotMoved", () => {
  const shots = [shot("a", 0), shot("b", 1), shot("c", 2), shot("d", 3)];

  it("moves a Shot forward and shifts the Shots in between back", () => {
    const moved = withShotMoved(shots, "a", 2);

    expect(timelineIdsInTabOrder(moved)).toEqual(["b", "c", "a", "d"]);
    expect(moved.map((movedShot) => movedShot.shot_index)).toEqual([
      0, 1, 2, 3
    ]);
  });

  it("moves a Shot backward and shifts the Shots in between forward", () => {
    expect(timelineIdsInTabOrder(withShotMoved(shots, "d", 1))).toEqual([
      "a",
      "d",
      "b",
      "c"
    ]);
  });

  it("puts a Shot last when the target is past the end", () => {
    expect(timelineIdsInTabOrder(withShotMoved(shots, "b", 99))).toEqual([
      "a",
      "c",
      "d",
      "b"
    ]);
  });

  it("orders by shot index, not by array position", () => {
    const shuffledShots = [shot("c", 2), shot("a", 0), shot("b", 1)];

    expect(timelineIdsInTabOrder(withShotMoved(shuffledShots, "c", 0))).toEqual(
      ["c", "a", "b"]
    );
  });

  it("leaves the Shots untouched when the moved Shot is unknown", () => {
    expect(withShotMoved(shots, "missing", 0)).toBe(shots);
  });
});
