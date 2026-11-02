import { ProjectStateSchema, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { describeSceneStoryboard } from "./describeSceneStoryboard";

const sceneWith = (overrides: Record<string, unknown>): ShotState =>
  ProjectStateSchema.parse({
    project_id: "project",
    keys: [],
    shots: [
      { timeline_id: "scene", shot_index: 0, sequence_id: 1, ...overrides }
    ]
  }).shots[0]!;

describe("describeSceneStoryboard", () => {
  it("reads the backend's scene storyboard when the project state carries one", () => {
    const view = describeSceneStoryboard(
      sceneWith({ storyboard: { status: "ready", version_count: 3 } }),
      []
    );
    expect(view).toMatchObject({ canListVersions: true, versionCount: 3 });
  });

  it("falls back to the storyboard sheet and its tag on a backend without scene storyboards", () => {
    const view = describeSceneStoryboard(
      sceneWith({
        tags: {
          characters: [],
          environments: [],
          props: [buildStoryboardSheetToken("scene")]
        }
      }),
      []
    );
    expect(view).toMatchObject({
      canListVersions: false,
      isUsedInVideoRenders: true
    });
  });
});
