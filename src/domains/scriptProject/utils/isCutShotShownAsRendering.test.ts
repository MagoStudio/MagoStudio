import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isCutShotShownAsRendering } from "./isCutShotShownAsRendering";

const shot = ProjectCutSchema.parse({
  project_id: "project",
  shots: [{ timeline_id: "scene", shot_index: 0, sequence_id: 1 }]
}).shots[0];

describe("isCutShotShownAsRendering", () => {
  it("shows a scene that is rendering as rendering", () => {
    expect(isCutShotShownAsRendering({ shot, isShotRendering: true })).toBe(
      true
    );
  });

  it("shows a scene hidden until its dub lands as rendering", () => {
    expect(
      isCutShotShownAsRendering({
        shot: { ...shot, isSceneHiddenUntilDubLands: true },
        isShotRendering: false
      })
    ).toBe(true);
  });

  it("shows a finished scene with no dub pending as it is", () => {
    expect(isCutShotShownAsRendering({ shot, isShotRendering: false })).toBe(
      false
    );
  });
});
