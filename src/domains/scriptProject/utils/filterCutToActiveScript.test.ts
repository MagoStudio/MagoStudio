import { CutShot, ProjectCut, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { filterCutToActiveScript } from "./filterCutToActiveScript";

const buildCutShot = (timelineId: string, sequenceId: number): CutShot => ({
  timeline_id: timelineId,
  shot_index: sequenceId - 1,
  sequence_id: sequenceId,
  asset_id: null,
  pinned_asset_id: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: []
});

const buildDroppedShot = (timelineId: string, sequenceId: number): ShotState =>
  ({
    timeline_id: timelineId,
    shot_index: sequenceId - 1,
    sequence_id: sequenceId,
    dropped: true,
    tags: { characters: [], environments: [], props: [] },
    references: {},
    missing_references: []
  }) as unknown as ShotState;

const cut: ProjectCut = {
  project_id: "project-1",
  shots: [
    buildCutShot("timeline-1", 1),
    buildCutShot("timeline-2", 2),
    buildCutShot("timeline-3", 3)
  ],
  missing: [2, 3],
  missing_timeline_ids: [],
  hidden_shots: [],
  export: null
};

describe("filterCutToActiveScript", () => {
  it("drops cut Shots a re-cast dropped", () => {
    const { cutShotsInActiveScript } = filterCutToActiveScript(cut, [
      buildDroppedShot("timeline-2", 2)
    ]);

    expect(cutShotsInActiveScript.map((shot) => shot.timeline_id)).toEqual([
      "timeline-1",
      "timeline-3"
    ]);
  });

  it("drops missing sequence ids a re-cast dropped", () => {
    const { missingSequenceIdsInActiveScript } = filterCutToActiveScript(cut, [
      buildDroppedShot("timeline-2", 2)
    ]);

    expect(missingSequenceIdsInActiveScript).toEqual([3]);
  });

  it("keeps every cut Shot when the re-cast dropped none", () => {
    const { cutShotsInActiveScript, missingSequenceIdsInActiveScript } =
      filterCutToActiveScript(cut, []);

    expect(cutShotsInActiveScript).toHaveLength(3);
    expect(missingSequenceIdsInActiveScript).toEqual([2, 3]);
  });

  it("returns empty lists when the cut has not loaded", () => {
    const { cutShotsInActiveScript, missingSequenceIdsInActiveScript } =
      filterCutToActiveScript(undefined, [buildDroppedShot("timeline-2", 2)]);

    expect(cutShotsInActiveScript).toEqual([]);
    expect(missingSequenceIdsInActiveScript).toEqual([]);
  });
});
