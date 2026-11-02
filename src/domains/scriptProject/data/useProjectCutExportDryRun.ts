import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { postProjectCutExport } from "../api/postProjectCutExport";

/** What an export would do, without dispatching one, so the button can say up front that it
 * will hand back separate files instead of one MP4. */
export const useProjectCutExportDryRun = (
  projectId: string | null | undefined
) =>
  useQuery({
    queryKey: queryKeys.projectCut.exportDryRun(projectId),
    queryFn: () =>
      postProjectCutExport({ projectId: projectId!, isDryRun: true }),
    enabled: !!projectId
  });
