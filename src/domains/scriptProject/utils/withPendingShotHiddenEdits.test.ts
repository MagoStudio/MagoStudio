import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { withPendingShotHiddenEdits } from "./withPendingShotHiddenEdits";

const shot = (timelineId: string, hidden: boolean) =>
  ({ timeline_id: timelineId, hidden }) as ShotState;

describe("withPendingShotHiddenEdits", () => {
  it("shows a pending hide before the backend answers", () => {
    const shots = [shot("a", false), shot("b", false)];

    expect(
      withPendingShotHiddenEdits(shots, new Map([["a", true]])).map(
        (editedShot) => editedShot.hidden
      )
    ).toEqual([true, false]);
  });

  it("shows a pending unhide over a stale hidden state", () => {
    expect(
      withPendingShotHiddenEdits([shot("a", true)], new Map([["a", false]]))[0]
        ?.hidden
    ).toBe(false);
  });

  it("returns the same Shots when nothing is pending", () => {
    const shots = [shot("a", false)];

    expect(withPendingShotHiddenEdits(shots, new Map())).toBe(shots);
  });

  it("keeps a Shot untouched when the pending value already matches", () => {
    const unchangedShot = shot("a", true);

    expect(
      withPendingShotHiddenEdits([unchangedShot], new Map([["a", true]]))[0]
    ).toBe(unchangedShot);
  });
});
