import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { findPredecessorShotInActiveScript } from "./findPredecessorShotInActiveScript";

const buildShot = (timelineId: string): ShotState =>
  ({ timeline_id: timelineId }) as unknown as ShotState;

describe("findPredecessorShotInActiveScript", () => {
  it("returns the shot directly before it in the active script", () => {
    const a = buildShot("a");
    const b = buildShot("b");
    expect(findPredecessorShotInActiveScript(b, [a, b])).toBe(a);
  });

  it("returns undefined for the first shot in the active script", () => {
    const a = buildShot("a");
    expect(findPredecessorShotInActiveScript(a, [a])).toBeUndefined();
  });

  it("returns undefined for a shot dropped out of the active script", () => {
    const a = buildShot("a");
    const dropped = buildShot("dropped");
    expect(findPredecessorShotInActiveScript(dropped, [a])).toBeUndefined();
  });
});
