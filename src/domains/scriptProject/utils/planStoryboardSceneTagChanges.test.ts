import {
  ProjectStateSchema,
  SheetGroup,
  SheetImage,
  ShotState
} from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { planStoryboardSceneTagChanges } from "./planStoryboardSceneTagChanges";

const SCENE_ID = "scene-a";

const buildScene = (isStoryboardTagged: boolean) =>
  ProjectStateSchema.parse({
    project_id: "project",
    keys: [],
    shots: [
      {
        timeline_id: SCENE_ID,
        shot_index: 0,
        sequence_id: 1,
        tags: {
          characters: [],
          environments: [],
          props: isStoryboardTagged ? [buildStoryboardSheetToken(SCENE_ID)] : []
        }
      }
    ]
  }).shots[0]! as ShotState;

const storyboardImage = (status: string, createdAt: string): SheetImage => ({
  asset_id: `image-${createdAt}`,
  clip_id: `clip-${createdAt}`,
  source: "render",
  url: status === "success" ? "https://cdn.example/storyboard.png" : null,
  thumbnail_url: null,
  has_description: false,
  status,
  created_at: createdAt
});

const storyboardSheetGroup = (images: SheetImage[]): SheetGroup =>
  ({
    token: buildStoryboardSheetToken(SCENE_ID),
    name: "Storyboard",
    enabled: true,
    layer_id: "layer",
    layer_order: 0,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images
  }) as SheetGroup;

const plan = ({
  isStoryboardTagged,
  images,
  isAwaitingStoryboard
}: {
  isStoryboardTagged: boolean;
  images: SheetImage[];
  isAwaitingStoryboard: boolean;
}) =>
  planStoryboardSceneTagChanges({
    scenes: [buildScene(isStoryboardTagged)],
    storyboardSheetGroups: [storyboardSheetGroup(images)],
    sceneTimelineIdsAwaitingStoryboard: new Set(
      isAwaitingStoryboard ? [SCENE_ID] : []
    )
  });

const timelineIdsOf = (scenes: ShotState[]) =>
  scenes.map((scene) => scene.timeline_id);

describe("planStoryboardSceneTagChanges", () => {
  it("attaches a requested storyboard once its render succeeds", () => {
    const changes = plan({
      isStoryboardTagged: false,
      images: [storyboardImage("success", "2026-10-27T10:00:00Z")],
      isAwaitingStoryboard: true
    });
    expect(timelineIdsOf(changes.scenesToAttachStoryboard)).toEqual([SCENE_ID]);
    expect(changes.sceneTimelineIdsNoLongerAwaitingStoryboard).toEqual([
      SCENE_ID
    ]);
  });

  it("waits while the requested storyboard is still rendering", () => {
    const changes = plan({
      isStoryboardTagged: false,
      images: [storyboardImage("processing", "2026-10-27T10:00:00Z")],
      isAwaitingStoryboard: true
    });
    expect(changes.scenesToAttachStoryboard).toEqual([]);
    expect(changes.sceneTimelineIdsNoLongerAwaitingStoryboard).toEqual([]);
  });

  it("keeps waiting while the first render has not reached the project state yet", () => {
    const changes = plan({
      isStoryboardTagged: false,
      images: [],
      isAwaitingStoryboard: true
    });
    expect(changes.sceneTimelineIdsNoLongerAwaitingStoryboard).toEqual([]);
  });

  it("stops waiting without attaching when the requested storyboard fails", () => {
    const changes = plan({
      isStoryboardTagged: false,
      images: [storyboardImage("failed", "2026-10-27T10:00:00Z")],
      isAwaitingStoryboard: true
    });
    expect(changes.scenesToAttachStoryboard).toEqual([]);
    expect(changes.sceneTimelineIdsNoLongerAwaitingStoryboard).toEqual([
      SCENE_ID
    ]);
  });

  it("detaches a storyboard that has no image yet, so it never blocks the scene, and re-attaches it once it renders", () => {
    const changes = plan({
      isStoryboardTagged: true,
      images: [storyboardImage("processing", "2026-10-27T10:00:00Z")],
      isAwaitingStoryboard: false
    });
    expect(timelineIdsOf(changes.scenesToDetachStoryboard)).toEqual([SCENE_ID]);
    expect(changes.sceneTimelineIdsNowAwaitingStoryboard).toEqual([SCENE_ID]);
  });

  it("detaches a storyboard whose every render failed", () => {
    const changes = plan({
      isStoryboardTagged: true,
      images: [storyboardImage("failed", "2026-10-27T10:00:00Z")],
      isAwaitingStoryboard: false
    });
    expect(timelineIdsOf(changes.scenesToDetachStoryboard)).toEqual([SCENE_ID]);
    expect(changes.sceneTimelineIdsNowAwaitingStoryboard).toEqual([]);
  });

  it("keeps an attached storyboard that rendered before, even while a new version fails", () => {
    const changes = plan({
      isStoryboardTagged: true,
      images: [
        storyboardImage("success", "2026-10-26T10:00:00Z"),
        storyboardImage("failed", "2026-10-27T10:00:00Z")
      ],
      isAwaitingStoryboard: false
    });
    expect(changes.scenesToDetachStoryboard).toEqual([]);
  });

  it("leaves a storyboard the user removed from the scene alone", () => {
    const changes = plan({
      isStoryboardTagged: false,
      images: [storyboardImage("success", "2026-10-26T10:00:00Z")],
      isAwaitingStoryboard: false
    });
    expect(changes.scenesToAttachStoryboard).toEqual([]);
  });

  it("leaves scenes the backend serves a scene storyboard for to the backend", () => {
    const changes = planStoryboardSceneTagChanges({
      scenes: [
        {
          ...buildScene(true),
          storyboard: ProjectStateSchema.parse({
            project_id: "project",
            keys: [],
            shots: [
              {
                timeline_id: SCENE_ID,
                shot_index: 0,
                sequence_id: 1,
                storyboard: { status: "missing" }
              }
            ]
          }).shots[0]!.storyboard
        }
      ],
      storyboardSheetGroups: [
        storyboardSheetGroup([
          storyboardImage("failed", "2026-10-27T10:00:00Z")
        ])
      ],
      sceneTimelineIdsAwaitingStoryboard: new Set()
    });
    expect(changes.scenesToDetachStoryboard).toEqual([]);
  });
});
