import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getProjectState } from "../api/getProjectState";
import { resolveSheetRenderPollIntervalMs } from "../utils/resolveSheetRenderPollIntervalMs";

export const useProjectState = (projectId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.projectState.byProjectId(projectId);
  return useQuery({
    queryKey,
    queryFn: () =>
      getProjectState(projectId!, {
        preferCache: !queryClient.getQueryData(queryKey)
      }),
    enabled: !!projectId,
    refetchInterval: (query) =>
      resolveSheetRenderPollIntervalMs({
        projectState: query.state.data,
        nowMs: Date.now()
      })
  });
};
