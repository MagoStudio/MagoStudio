import {
  ProjectStateSchema,
  SheetGroup,
  SheetImage,
  ShotState
} from "@schemas/scriptProject";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useKeepStoryboardTagsNonBlocking } from "./useKeepStoryboardTagsNonBlocking";
import { buildStoryboardSheetToken } from "./utils/buildStoryboardSheetToken";

const editShot = vi.hoisted(() => vi.fn());
vi.mock("./useEditProjectShot", () => ({
  useEditProjectShot: () => ({ mutate: editShot })
}));

const SCENE_ID = "scene-a";
const STORYBOARD_TOKEN = buildStoryboardSheetToken(SCENE_ID);

const sceneWithStoryboardTagged = (isStoryboardTagged: boolean) =>
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
          props: isStoryboardTagged ? [STORYBOARD_TOKEN] : []
        }
      }
    ]
  }).shots[0]! as ShotState;

const storyboardWithImageStatus = (status: string): SheetGroup =>
  ({
    token: STORYBOARD_TOKEN,
    name: "Storyboard",
    enabled: true,
    layer_id: "layer",
    layer_order: 0,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images: [
      {
        asset_id: "image",
        clip_id: "clip",
        source: "render",
        url: status === "success" ? "https://cdn.example/storyboard.png" : null,
        thumbnail_url: null,
        has_description: false,
        status,
        created_at: "2026-10-27T10:00:00Z"
      } satisfies SheetImage
    ]
  }) as SheetGroup;

describe("useKeepStoryboardTagsNonBlocking", () => {
  beforeEach(() => editShot.mockReset());

  it("untags a storyboard that is still rendering and tags it back once it succeeds", () => {
    const hook = renderHook(
      (props: { scene: ShotState; storyboardSheetGroup: SheetGroup }) =>
        useKeepStoryboardTagsNonBlocking({
          projectId: "project",
          scenes: [props.scene],
          storyboardSheetGroups: [props.storyboardSheetGroup]
        }),
      {
        initialProps: {
          scene: sceneWithStoryboardTagged(true),
          storyboardSheetGroup: storyboardWithImageStatus("processing")
        }
      }
    );
    expect(editShot).toHaveBeenCalledTimes(1);
    expect(editShot.mock.calls[0]![0].tags.props).toEqual([]);
    editShot.mock.calls[0]![1].onSettled();

    hook.rerender({
      scene: sceneWithStoryboardTagged(false),
      storyboardSheetGroup: storyboardWithImageStatus("success")
    });

    expect(editShot).toHaveBeenCalledTimes(2);
    expect(editShot.mock.calls[1]![0].tags.props).toEqual([STORYBOARD_TOKEN]);
  });

  it("tags a storyboard the user just generated only after it succeeds", () => {
    const hook = renderHook(
      (props: { storyboardSheetGroups: SheetGroup[] }) =>
        useKeepStoryboardTagsNonBlocking({
          projectId: "project",
          scenes: [sceneWithStoryboardTagged(false)],
          storyboardSheetGroups: props.storyboardSheetGroups
        }),
      { initialProps: { storyboardSheetGroups: [] as SheetGroup[] } }
    );
    hook.result.current.markSceneAwaitingStoryboard(SCENE_ID);

    hook.rerender({
      storyboardSheetGroups: [storyboardWithImageStatus("processing")]
    });
    expect(editShot).not.toHaveBeenCalled();

    hook.rerender({
      storyboardSheetGroups: [storyboardWithImageStatus("success")]
    });
    expect(editShot).toHaveBeenCalledTimes(1);
    expect(editShot.mock.calls[0]![0].tags.props).toEqual([STORYBOARD_TOKEN]);
  });
});
