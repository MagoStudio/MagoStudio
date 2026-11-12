import { CutShot, ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isCutShotVersionShownAsRendering } from "./isCutShotVersionShownAsRendering";

const cutShot = ({
  isSceneHiddenUntilDubLands,
  ...overrides
}: {
  isSceneHiddenUntilDubLands?: boolean;
  [field: string]: unknown;
}): CutShot => ({
  ...ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        asset_id: "pinned",
        versions: [
          { layer_id: "l1", asset_id: "pinned", ready: true },
          { layer_id: "l2", asset_id: "rendering", ready: false }
        ],
        ...overrides
      }
    ]
  }).shots[0],
  isSceneHiddenUntilDubLands
});

describe("isCutShotVersionShownAsRendering", () => {
  it("shows a version that is still rendering as rendering", () => {
    const shot = cutShot({});
    expect(isCutShotVersionShownAsRendering(shot, shot.versions[1])).toBe(true);
  });

  it("shows a landed version waiting for its dub as rendering", () => {
    const shot = cutShot({
      versions: [
        { layer_id: "l1", asset_id: "pinned", ready: true },
        { layer_id: "l2", asset_id: "landed", ready: true, awaiting_dub: true }
      ]
    });
    expect(isCutShotVersionShownAsRendering(shot, shot.versions[1])).toBe(true);
  });

  it("shows a finished version of a scene with no dub pending as it is", () => {
    const shot = cutShot({});
    expect(isCutShotVersionShownAsRendering(shot, shot.versions[0])).toBe(
      false
    );
  });
});
