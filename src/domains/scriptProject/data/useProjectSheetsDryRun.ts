import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { postGenerateProjectSheets } from "../api/postGenerateProjectSheets";

export const useProjectSheetsDryRun = (
  projectId: string | null | undefined,
  outputSize: [number, number],
  settings?: Record<string, unknown>,
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.projectState.sheetsDryRun(
      projectId,
      outputSize,
      settings
    ),
    queryFn: () =>
      postGenerateProjectSheets({
        projectId: projectId!,
        isDryRun: true,
        outputSize,
        settings
      }),
    enabled: !!projectId && enabled
  });
};
