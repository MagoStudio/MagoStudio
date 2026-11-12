import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isRenderingVersionMissingFromCut } from "./isRenderingVersionMissingFromCut";

const sceneWith = (versions: Record<string, unknown>[]) =>
  ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        asset_id: "v1",
        pinned_asset_id: "v1",
        versions: versions.map((version, index) => ({
          layer_id: `layer-${index}`,
          ...version
        }))
      }
    ]
  }).shots[0]!;

describe("isRenderingVersionMissingFromCut", () => {
  it("is true while the scene renders and the new render is not in the cut yet", () => {
    expect(
      isRenderingVersionMissingFromCut({
        isSceneRendering: true,
        cutShot: sceneWith([{ asset_id: "v1", ready: true }])
      })
    ).toBe(true);
  });

  it("is false while the new render is in the cut, still rendering", () => {
    expect(
      isRenderingVersionMissingFromCut({
        isSceneRendering: true,
        cutShot: sceneWith([
          { asset_id: "v1", ready: true },
          { asset_id: "v2", ready: false, status: "inprogress" }
        ])
      })
    ).toBe(false);
  });

  it("is false while the new render is in the cut, waiting for its dub", () => {
    expect(
      isRenderingVersionMissingFromCut({
        isSceneRendering: true,
        cutShot: sceneWith([
          { asset_id: "v1", ready: true },
          { asset_id: "v2", ready: true, awaiting_dub: true }
        ])
      })
    ).toBe(false);
  });

  it("is false when the scene is not rendering or has never rendered", () => {
    expect(
      isRenderingVersionMissingFromCut({
        isSceneRendering: false,
        cutShot: sceneWith([{ asset_id: "v1", ready: true }])
      })
    ).toBe(false);
    expect(
      isRenderingVersionMissingFromCut({
        isSceneRendering: true,
        cutShot: undefined
      })
    ).toBe(false);
  });
});
