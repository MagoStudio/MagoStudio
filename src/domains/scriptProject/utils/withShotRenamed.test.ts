import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { withShotRenamed } from "./withShotRenamed";

const shot = (timelineId: string, heading: string) =>
  ({ timeline_id: timelineId, shot_index: 0, heading }) as ShotState;

describe("withShotRenamed", () => {
  it("renames only the matching Shot", () => {
    const shots = [shot("a", "1 Opening"), shot("b", "2 Ending")];

    const renamed = withShotRenamed(shots, "b", "2 Finale");

    expect(renamed.map((renamedShot) => renamedShot.heading)).toEqual([
      "1 Opening",
      "2 Finale"
    ]);
    expect(renamed[0]).toBe(shots[0]);
  });
});
