import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { findSequentialPredecessorShot } from "./findSequentialPredecessorShot";

const shot = (timelineId: string, hidden = false) =>
  ({ timeline_id: timelineId, hidden }) as ShotState;

describe("findSequentialPredecessorShot", () => {
  it("returns the Shot right before, when it is shown", () => {
    const first = shot("a");
    const second = shot("b");

    expect(findSequentialPredecessorShot(second, [first, second])).toBe(first);
  });

  it("skips a hidden Shot, because it is not in the cut", () => {
    const first = shot("a");
    const hidden = shot("b", true);
    const third = shot("c");

    expect(findSequentialPredecessorShot(third, [first, hidden, third])).toBe(
      first
    );
  });

  it("still finds a predecessor for a hidden Shot itself", () => {
    const first = shot("a");
    const hidden = shot("b", true);

    expect(findSequentialPredecessorShot(hidden, [first, hidden])).toBe(first);
  });

  it("returns nothing for the first Shot", () => {
    const first = shot("a");

    expect(findSequentialPredecessorShot(first, [first])).toBeUndefined();
  });
});
