import { SheetGroup, ShotState } from "@schemas/scriptProject";
import { useEffect, useRef } from "react";

import { useEditProjectShot } from "./useEditProjectShot";
import { buildStoryboardSheetToken } from "./utils/buildStoryboardSheetToken";
import {
  STORYBOARD_TAG_CATEGORY,
  planStoryboardSceneTagChanges
} from "./utils/planStoryboardSceneTagChanges";
import {
  withShotTagAdded,
  withShotTagRemoved
} from "./utils/shotTagCategories";

export const useKeepStoryboardTagsNonBlocking = ({
  projectId,
  scenes,
  storyboardSheetGroups
}: {
  projectId: string;
  scenes: ShotState[];
  storyboardSheetGroups: SheetGroup[];
}) => {
  const { mutate: editShot } = useEditProjectShot();
  const sceneTimelineIdsAwaitingStoryboardRef = useRef(new Set<string>());
  const sceneTimelineIdsWithTagEditInFlightRef = useRef(new Set<string>());

  const editStoryboardTag = (
    scene: ShotState,
    withStoryboardTagChanged: typeof withShotTagAdded
  ) => {
    const sceneTimelineId = scene.timeline_id;
    const sceneTimelineIdsWithTagEditInFlight =
      sceneTimelineIdsWithTagEditInFlightRef.current;
    if (sceneTimelineIdsWithTagEditInFlight.has(sceneTimelineId)) return;
    sceneTimelineIdsWithTagEditInFlight.add(sceneTimelineId);
    editShot(
      {
        projectId,
        timelineId: sceneTimelineId,
        tags: withStoryboardTagChanged(
          scene.tags,
          STORYBOARD_TAG_CATEGORY,
          buildStoryboardSheetToken(sceneTimelineId)
        )
      },
      {
        onSettled: () =>
          sceneTimelineIdsWithTagEditInFlight.delete(sceneTimelineId)
      }
    );
  };

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: tags a storyboard onto its scene only once it has an image, and untags one without, because the backend blocks a scene's video on any tag with no image
  useEffect(() => {
    const sceneTimelineIdsAwaitingStoryboard =
      sceneTimelineIdsAwaitingStoryboardRef.current;
    const changes = planStoryboardSceneTagChanges({
      scenes,
      storyboardSheetGroups,
      sceneTimelineIdsAwaitingStoryboard
    });
    changes.scenesToDetachStoryboard.forEach((scene) =>
      editStoryboardTag(scene, withShotTagRemoved)
    );
    changes.scenesToAttachStoryboard.forEach((scene) =>
      editStoryboardTag(scene, withShotTagAdded)
    );
    changes.sceneTimelineIdsNowAwaitingStoryboard.forEach((sceneTimelineId) =>
      sceneTimelineIdsAwaitingStoryboard.add(sceneTimelineId)
    );
    changes.sceneTimelineIdsNoLongerAwaitingStoryboard.forEach(
      (sceneTimelineId) =>
        sceneTimelineIdsAwaitingStoryboard.delete(sceneTimelineId)
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- editStoryboardTag is read fresh each run; the plan only changes with the scenes and their storyboards, which refresh after every storyboard render
  }, [scenes, storyboardSheetGroups]);

  return {
    markSceneAwaitingStoryboard: (sceneTimelineId: string) => {
      sceneTimelineIdsAwaitingStoryboardRef.current.add(sceneTimelineId);
    }
  };
};
