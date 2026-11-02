import {
  ProjectStateSchema,
  SheetGroup,
  SheetImage,
  ShotState
} from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { listScenesAwaitingStoryboard } from "./listScenesAwaitingStoryboard";

const buildScene = (overrides: Partial<ShotState> & { timeline_id: string }) =>
  ({
    ...ProjectStateSchema.parse({
      project_id: "project",
      keys: [],
      shots: [
        {
          timeline_id: overrides.timeline_id,
          shot_index: 0,
          sequence_id: 1,
          video_prompt: "The hero walks in.",
          tags: { characters: [], environments: [], props: [] }
        }
      ]
    }).shots[0]!,
    ...overrides
  }) as ShotState;

const storyboardSheetGroupFor = (
  sceneTimelineId: string,
  image: Pick<SheetImage, "status"> & Partial<Pick<SheetImage, "url">>
): SheetGroup =>
  ({
    token: buildStoryboardSheetToken(sceneTimelineId),
    name: "Storyboard",
    enabled: true,
    layer_id: "layer",
    layer_order: 0,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images: [
      {
        asset_id: `${sceneTimelineId}-image`,
        clip_id: `${sceneTimelineId}-clip`,
        source: "render",
        url: "https://cdn.example/storyboard.png",
        thumbnail_url: null,
        has_description: false,
        created_at: "2026-10-26T10:00:00Z",
        ...image
      }
    ]
  }) as SheetGroup;

const timelineIdsOf = (
  awaiting: ReturnType<typeof listScenesAwaitingStoryboard>
) => awaiting.map(({ scene }) => scene.timeline_id);

describe("listScenesAwaitingStoryboard", () => {
  it("lists a scene with shots and no storyboard, with its panels", () => {
    const awaiting = listScenesAwaitingStoryboard({
      scenes: [buildScene({ timeline_id: "scene-a" })],
      storyboardSheetGroups: []
    });

    expect(timelineIdsOf(awaiting)).toEqual(["scene-a"]);
    expect(awaiting[0]!.storyboardBeats).toEqual([
      expect.objectContaining({ action: "The hero walks in." })
    ]);
  });

  it("skips a scene whose storyboard is finished or still rendering", () => {
    const awaiting = listScenesAwaitingStoryboard({
      scenes: [
        buildScene({ timeline_id: "finished" }),
        buildScene({ timeline_id: "rendering" })
      ],
      storyboardSheetGroups: [
        storyboardSheetGroupFor("finished", { status: "success" }),
        storyboardSheetGroupFor("rendering", { status: "pending" })
      ]
    });

    expect(timelineIdsOf(awaiting)).toEqual([]);
  });

  it("lists a scene whose only storyboard failed, so the batch retries it", () => {
    const awaiting = listScenesAwaitingStoryboard({
      scenes: [buildScene({ timeline_id: "failed" })],
      storyboardSheetGroups: [
        storyboardSheetGroupFor("failed", { status: "failed", url: null })
      ]
    });

    expect(timelineIdsOf(awaiting)).toEqual(["failed"]);
  });

  it("skips hidden scenes, scenes from an earlier script, and scenes with no shots", () => {
    const awaiting = listScenesAwaitingStoryboard({
      scenes: [
        buildScene({ timeline_id: "hidden", hidden: true }),
        buildScene({ timeline_id: "dropped", dropped: true }),
        buildScene({ timeline_id: "empty", video_prompt: "" })
      ],
      storyboardSheetGroups: []
    });

    expect(timelineIdsOf(awaiting)).toEqual([]);
  });

  it("skips a locked scene", () => {
    const awaiting = listScenesAwaitingStoryboard({
      scenes: [
        buildScene({ timeline_id: "locked", locked: true }),
        buildScene({ timeline_id: "unlocked" })
      ],
      storyboardSheetGroups: []
    });

    expect(timelineIdsOf(awaiting)).toEqual(["unlocked"]);
  });

  it("asks the scene storyboard backend: missing, failed and stale scenes are due, the rest are not", () => {
    const sceneWithStoryboardStatus = (timelineId: string, status: string) =>
      buildScene({
        timeline_id: timelineId,
        storyboard: ProjectStateSchema.parse({
          project_id: "project",
          keys: [],
          shots: [
            {
              timeline_id: timelineId,
              shot_index: 0,
              sequence_id: 1,
              storyboard: { status, shot_count: 1 }
            }
          ]
        }).shots[0]!.storyboard
      });

    expect(
      timelineIdsOf(
        listScenesAwaitingStoryboard({
          scenes: [
            sceneWithStoryboardStatus("missing", "missing"),
            sceneWithStoryboardStatus("failed", "failed"),
            sceneWithStoryboardStatus("stale", "stale"),
            sceneWithStoryboardStatus("ready", "ready"),
            sceneWithStoryboardStatus("generating", "generating")
          ],
          storyboardSheetGroups: []
        })
      )
    ).toEqual(["missing", "failed", "stale"]);
  });
});
