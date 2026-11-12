/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: a scene leaves the backend's in-progress set on a timer, not from a user event, and the cut must be re-read once when it does */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { queryKeys } from "@/queryKeys";

import { useProjectCut } from "./data/useProjectCut";

export const useRefreshCutWhileShotsRender = (
  projectId: string | null | undefined,
  renderingShotTimelineIds: ReadonlySet<string>
) => {
  const queryClient = useQueryClient();
  useProjectCut(projectId, {
    isAnyShotRendering: renderingShotTimelineIds.size > 0
  });

  const previousRenderingIdsRef = useRef<ReadonlySet<string>>(
    renderingShotTimelineIds
  );

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler -- a scene settling is a backend event polled on a timer, not a user event the caller could own */
  useEffect(() => {
    const previousRenderingIds = previousRenderingIdsRef.current;
    previousRenderingIdsRef.current = renderingShotTimelineIds;
    const hasAnySceneSettled = [...previousRenderingIds].some(
      (timelineId) => !renderingShotTimelineIds.has(timelineId)
    );
    if (!projectId || !hasAnySceneSettled) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectCut.byProjectId(projectId)
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectState.byProjectId(projectId)
    });
  }, [renderingShotTimelineIds, projectId, queryClient]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler */
};
