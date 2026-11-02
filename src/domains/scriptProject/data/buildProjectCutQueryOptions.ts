import { queryKeys } from "@/queryKeys";

import { getProjectCut } from "../api/getProjectCut";

export const buildProjectCutQueryOptions = (
  projectId: string | null | undefined
) => ({
  queryKey: queryKeys.projectCut.byProjectId(projectId),
  queryFn: () => getProjectCut(projectId!)
});
