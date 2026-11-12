import { SheetGroup, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { filterShotsByQuery } from "./filterShotsByQuery";

const sheetGroups: SheetGroup[] = [
  {
    token: "sergeant",
    name: "Sergeant Kovac",
    kind: "character",
    description: null,
    prompt: null,
    enabled: true,
    layer_id: "layer-sergeant",
    layer_order: 0,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images: []
  }
];

const shot = (
  sequenceId: number,
  heading: string,
  videoPrompt: string,
  characters: string[] = []
): ShotState => ({
  timeline_id: `timeline-${sequenceId}`,
  shot_index: sequenceId - 1,
  sequence_id: sequenceId,
  heading,
  video_prompt: videoPrompt,
  tags: { characters, environments: [], props: [] },
  references: {},
  missing_references: [],
  dialogue_untagged_speakers: [],
  dropped: false,
  hidden: false,
  manual: false
});

const shots = [
  shot(2, "EXT. RUINED COLONY", "Slow push past the fallen strut.", [
    "sergeant"
  ]),
  shot(3, "INT. MEDIC TENT", "Static two-shot, lamp-lit canvas.", ["medic"]),
  shot(4, "EXT. BREACH", "Handheld, low angle on the hatch.")
];

describe("filterShotsByQuery", () => {
  it("returns every shot for an empty query", () => {
    expect(filterShotsByQuery(shots, sheetGroups, "")).toHaveLength(3);
    expect(filterShotsByQuery(shots, sheetGroups, "  ")).toHaveLength(3);
  });

  it("matches the heading, ignoring case", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "medic tent");
    expect(found.map((s) => s.sequence_id)).toEqual([3]);
  });

  it("matches the video prompt", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "handheld");
    expect(found.map((s) => s.sequence_id)).toEqual([4]);
  });

  it("matches a tagged entity by its token", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "sergeant");
    expect(found.map((s) => s.sequence_id)).toEqual([2]);
  });

  it("matches a tagged entity by its display name, which the row actually shows", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "kovac");
    expect(found.map((s) => s.sequence_id)).toEqual([2]);
  });

  it("matches the sequence id, so a user can jump to a numbered shot", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "3");
    expect(found.map((s) => s.sequence_id)).toEqual([3]);
  });

  it("returns nothing when no shot matches", () => {
    expect(filterShotsByQuery(shots, sheetGroups, "zzz")).toEqual([]);
  });

  it("keeps shot order", () => {
    const found = filterShotsByQuery(shots, sheetGroups, "ext.");
    expect(found.map((s) => s.sequence_id)).toEqual([2, 4]);
  });
});
