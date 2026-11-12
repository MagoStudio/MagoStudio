import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isSceneHiddenUntilDubLands } from "./isSceneHiddenUntilDubLands";

const sceneWith = (
  cutAssetId: string | null,
  versions: Record<string, unknown>[]
) =>
  ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        asset_id: cutAssetId,
        versions: versions.map((version, index) => ({
          layer_id: `layer-${index}`,
          ...version
        }))
      }
    ]
  }).shots[0]!;

describe("isSceneHiddenUntilDubLands", () => {
  it("hides a first render waiting for its dub, which the cut does not serve yet", () => {
    expect(
      isSceneHiddenUntilDubLands(
        sceneWith(null, [
          { asset_id: "first", ready: true, awaiting_dub: true }
        ])
      )
    ).toBe(true);
  });

  it("keeps a scene playable while only a newer take awaits its dub", () => {
    expect(
      isSceneHiddenUntilDubLands(
        sceneWith("dubbed", [
          { asset_id: "dubbed", ready: true },
          { asset_id: "newer", ready: true, awaiting_dub: true }
        ])
      )
    ).toBe(false);
  });

  it("does not hide a scene whose only take failed with a stale flag", () => {
    expect(
      isSceneHiddenUntilDubLands(
        sceneWith(null, [
          {
            asset_id: "failed",
            ready: false,
            status: "error",
            awaiting_dub: true
          }
        ])
      )
    ).toBe(false);
  });
});
