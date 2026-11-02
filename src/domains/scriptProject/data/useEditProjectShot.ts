import { ProjectState } from "@schemas/scriptProject";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  EditProjectShotRequest,
  patchProjectShot
} from "../api/patchProjectShot";
import { withShotMoved } from "../utils/withShotMoved";
import { withShotRenamed } from "../utils/withShotRenamed";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const EDIT_PROJECT_SHOT_MUTATION_KEY = ["editProjectShot"] as const;

const isLockOnlyEdit = (request: EditProjectShotRequest) =>
  request.isShotLocked !== undefined &&
  Object.entries(request).every(
    ([field, value]) =>
      ["projectId", "timelineId", "isShotLocked"].includes(field) ||
      value === undefined
  );

export const useEditProjectShot = (
  options?: ScriptProjectMutationOptions<EditProjectShotRequest>
) => {
  const queryClient = useQueryClient();

  const refetchShotsAndCut = async (request: EditProjectShotRequest) => {
    const doesEditChangeCut =
      request.isShotHidden !== undefined ||
      request.shotIndex !== undefined ||
      request.heading !== undefined;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      }),
      doesEditChangeCut &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectCut.byProjectId(request.projectId)
        })
    ]);
  };

  return useMutation({
    mutationKey: EDIT_PROJECT_SHOT_MUTATION_KEY,
    mutationFn: (request: EditProjectShotRequest) => patchProjectShot(request),
    onMutate: async (request) => {
      const { shotIndex, heading, isShotLocked, timelineId } = request;
      const isEditShownBeforeServerConfirms =
        shotIndex !== undefined ||
        heading !== undefined ||
        isShotLocked !== undefined;
      if (!isEditShownBeforeServerConfirms) return undefined;

      const withRequestedEdits = (shots: ProjectState["shots"]) => {
        const movedShots =
          shotIndex === undefined
            ? shots
            : withShotMoved(shots, timelineId, shotIndex);
        const renamedShots =
          heading === undefined
            ? movedShots
            : withShotRenamed(movedShots, timelineId, heading);
        return isShotLocked === undefined
          ? renamedShots
          : renamedShots.map((shot) =>
              shot.timeline_id === timelineId
                ? { ...shot, locked: isShotLocked }
                : shot
            );
      };

      const projectStateQueryKey = queryKeys.projectState.byProjectId(
        request.projectId
      );
      await queryClient.cancelQueries({
        queryKey: projectStateQueryKey,
        exact: true
      });
      const previousProjectState =
        queryClient.getQueryData<ProjectState>(projectStateQueryKey);
      queryClient.setQueryData<ProjectState>(
        projectStateQueryKey,
        (projectState) =>
          projectState && {
            ...projectState,
            shots: withRequestedEdits(projectState.shots)
          }
      );
      return { previousProjectState };
    },
    onSuccess: async (editedShot, request) => {
      if (!isLockOnlyEdit(request)) return refetchShotsAndCut(request);

      const projectStateQueryKey = queryKeys.projectState.byProjectId(
        request.projectId
      );
      queryClient.setQueryData<ProjectState>(
        projectStateQueryKey,
        (projectState) =>
          projectState && {
            ...projectState,
            shots: projectState.shots.map((shot) =>
              shot.timeline_id === request.timelineId
                ? { ...shot, locked: editedShot.locked ?? request.isShotLocked }
                : shot
            )
          }
      );
      await queryClient.invalidateQueries({
        queryKey: projectStateQueryKey,
        refetchType: "none"
      });
    },
    onError: (error, request, context) => {
      if (context?.previousProjectState) {
        queryClient.setQueryData(
          queryKeys.projectState.byProjectId(request.projectId),
          context.previousProjectState
        );
      }
      void refetchShotsAndCut(request);
      options?.onError?.(error, request);
    }
  });
};
