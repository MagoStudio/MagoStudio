import { ScriptVersionList } from "@schemas/scriptProject";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getProjectScriptVersions } from "../api/getProjectScriptVersions";
import { hasUnsettledScriptVersion } from "../utils/hasUnsettledScriptVersion";

const CASTING_POLL_INTERVAL_MS = 5000;

const didCastJustSettle = (
  versionsBeforeThisFetch: ScriptVersionList["versions"] | undefined,
  versionsAfterThisFetch: ScriptVersionList["versions"]
): boolean =>
  hasUnsettledScriptVersion(versionsBeforeThisFetch) &&
  !hasUnsettledScriptVersion(versionsAfterThisFetch);

export const useProjectScriptVersions = (
  projectId: string | null | undefined
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.projectScriptVersions.byProjectId(projectId),
    queryFn: async () => {
      const resultBeforeThisFetch = queryClient.getQueryData<
        ScriptVersionList | undefined
      >(queryKeys.projectScriptVersions.byProjectId(projectId));
      const versionsBeforeThisFetch = resultBeforeThisFetch?.versions;

      const result = await getProjectScriptVersions(projectId!, {
        preferCache: !resultBeforeThisFetch
      });

      if (didCastJustSettle(versionsBeforeThisFetch, result.versions)) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.project.byId(projectId!)
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projects.all
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.homepage.all
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projectList.all
        });
      }

      return result;
    },
    enabled: !!projectId,
    refetchInterval: (query) =>
      hasUnsettledScriptVersion(query.state.data?.versions)
        ? CASTING_POLL_INTERVAL_MS
        : false
  });
};
