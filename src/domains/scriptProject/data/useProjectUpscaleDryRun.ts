import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { postUpscaleProjectShots } from "../api/postUpscaleProjectShots";

export const useProjectUpscaleDryRun = (
  projectId: string | null | undefined
) => {
  return useQuery({
    queryKey: queryKeys.projectState.upscaleDryRun(projectId),
    queryFn: () =>
      postUpscaleProjectShots({ projectId: projectId!, isDryRun: true }),
    enabled: !!projectId
  });
};
