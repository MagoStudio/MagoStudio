import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { partitionShotsByDropped } from "./partitionShotsByDropped";

const buildShot = (sequenceId: number, isDropped: boolean): ShotState =>
  ({
    timeline_id: `timeline-${sequenceId}`,
    shot_index: sequenceId - 1,
    sequence_id: sequenceId,
    dropped: isDropped,
    tags: { characters: [], environments: [], props: [] },
    references: {},
    missing_references: []
  }) as unknown as ShotState;

const sequenceIdsOf = (shots: ShotState[]) =>
  shots.map((shot) => shot.sequence_id);

describe("partitionShotsByDropped", () => {
  it("separates the Shots a re-cast dropped from the ones the active script keeps", () => {
    const { shotsInActiveScript, shotsDroppedByRecast } =
      partitionShotsByDropped([
        buildShot(1, true),
        buildShot(2, false),
        buildShot(3, false)
      ]);

    expect(sequenceIdsOf(shotsInActiveScript)).toEqual([2, 3]);
    expect(sequenceIdsOf(shotsDroppedByRecast)).toEqual([1]);
  });

  it("keeps a Shot whose payload predates the dropped flag", () => {
    const { shotsInActiveScript, shotsDroppedByRecast } =
      partitionShotsByDropped([
        { ...buildShot(1, false), dropped: undefined } as unknown as ShotState
      ]);

    expect(sequenceIdsOf(shotsInActiveScript)).toEqual([1]);
    expect(shotsDroppedByRecast).toEqual([]);
  });

  it("returns empty lists for a project with no Shots", () => {
    const { shotsInActiveScript, shotsDroppedByRecast } =
      partitionShotsByDropped([]);

    expect(shotsInActiveScript).toEqual([]);
    expect(shotsDroppedByRecast).toEqual([]);
  });
});
