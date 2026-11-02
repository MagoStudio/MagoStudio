import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getProjectCut } from "../api/getProjectCut";

import { buildProjectCutQueryOptions } from "./buildProjectCutQueryOptions";

export const useProjectCut = (projectId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const projectCutQueryOptions = buildProjectCutQueryOptions(projectId);
  return useQuery({
    ...projectCutQueryOptions,
    queryFn: () =>
      getProjectCut(projectId!, {
        preferCache: !queryClient.getQueryData(projectCutQueryOptions.queryKey)
      }),
    enabled: !!projectId
  });
};
