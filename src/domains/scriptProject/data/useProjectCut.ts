import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getProjectCut } from "../api/getProjectCut";
import { isCutStillBeingProduced } from "../utils/isCutStillBeingProduced";
import { markScenesHiddenUntilDubLands } from "../utils/markScenesHiddenUntilDubLands";

import { buildProjectCutQueryOptions } from "./buildProjectCutQueryOptions";

export const CUT_POLL_INTERVAL_MS = 5_000;

export const useProjectCut = (
  projectId: string | null | undefined,
  { isAnyShotRendering = false }: { isAnyShotRendering?: boolean } = {}
) => {
  const queryClient = useQueryClient();
  const projectCutQueryOptions = buildProjectCutQueryOptions(projectId);
  return useQuery({
    ...projectCutQueryOptions,
    queryFn: () =>
      getProjectCut(projectId!, {
        preferCache: !queryClient.getQueryData(projectCutQueryOptions.queryKey)
      }),
    enabled: !!projectId,
    select: markScenesHiddenUntilDubLands,
    refetchInterval: (query) =>
      isAnyShotRendering ||
      (query.state.data && isCutStillBeingProduced(query.state.data))
        ? CUT_POLL_INTERVAL_MS
        : false
  });
};
