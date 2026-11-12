import { ProjectCut, ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { markScenesHiddenUntilDubLands } from "./markScenesHiddenUntilDubLands";

const cut: ProjectCut = ProjectCutSchema.parse({
  project_id: "project",
  shots: [
    {
      timeline_id: "first-render-dubbing",
      shot_index: 0,
      sequence_id: 1,
      asset_id: null,
      versions: [
        { layer_id: "l1", asset_id: "first", ready: true, awaiting_dub: true }
      ]
    },
    {
      timeline_id: "re-render-dubbing",
      shot_index: 1,
      sequence_id: 2,
      asset_id: "dubbed",
      versions: [
        { layer_id: "l2", asset_id: "dubbed", ready: true },
        { layer_id: "l3", asset_id: "newer", ready: true, awaiting_dub: true }
      ]
    },
    { timeline_id: "never-rendered", shot_index: 2, sequence_id: 3 }
  ]
});

describe("markScenesHiddenUntilDubLands", () => {
  it("hides a scene whose only landed render waits for its dub, and nothing else", () => {
    expect(
      markScenesHiddenUntilDubLands(cut).shots.map((shot) => [
        shot.timeline_id,
        shot.isSceneHiddenUntilDubLands
      ])
    ).toEqual([
      ["first-render-dubbing", true],
      ["re-render-dubbing", false],
      ["never-rendered", false]
    ]);
  });

  it("leaves the cut it was given untouched", () => {
    markScenesHiddenUntilDubLands(cut);
    expect(cut.shots[0].isSceneHiddenUntilDubLands).toBeUndefined();
  });
});
