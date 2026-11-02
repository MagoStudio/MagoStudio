import { useMutationState } from "@tanstack/react-query";

import { EditProjectShotRequest } from "./api/patchProjectShot";
import { EDIT_PROJECT_SHOT_MUTATION_KEY } from "./data/useEditProjectShot";

export const usePendingShotHiddenEdits = (
  projectId: string
): Map<string, boolean> => {
  const pendingEditRequests = useMutationState({
    filters: { mutationKey: EDIT_PROJECT_SHOT_MUTATION_KEY, status: "pending" },
    select: (mutation) =>
      mutation.state.variables as EditProjectShotRequest | undefined
  });

  return new Map(
    pendingEditRequests.flatMap((request) =>
      request?.projectId === projectId && request.isShotHidden !== undefined
        ? [[request.timelineId, request.isShotHidden] as const]
        : []
    )
  );
};
