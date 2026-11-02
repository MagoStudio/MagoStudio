import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchBulkRendersRuns } from "../api/fetchBulkRendersRuns";
import { resolveBulkRendersRunListPollInterval } from "../utils/resolveBulkRendersRunListPollInterval";

const useBulkRendersRunList = ({
  queryKey,
  projectId,
  enabled
}: {
  queryKey: readonly unknown[];
  projectId: string | undefined;
  enabled: boolean;
}) =>
  useQuery({
    queryKey,
    queryFn: () => fetchBulkRendersRuns(projectId),
    enabled,
    refetchInterval: (query) =>
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: query.state.status === "error",
        consecutiveFailureCount: query.state.fetchFailureCount,
        runs: query.state.data
      })
  });

export const useBulkRendersRunsForProject = (
  projectId: string | undefined,
  enabled = true
) =>
  useBulkRendersRunList({
    queryKey: queryKeys.bulkRendersRuns.byProjectId(projectId),
    projectId,
    enabled: !!projectId && enabled
  });

export const useBulkRendersRunsAcrossProjects = (enabled = true) =>
  useBulkRendersRunList({
    queryKey: queryKeys.bulkRendersRuns.everyProject(),
    projectId: undefined,
    enabled
  });
