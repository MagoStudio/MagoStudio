import { Project } from "@schemas/project";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  fetchProjectStats,
  ProjectStatsResponse
} from "./api/fetchProjectStats";

const STALE_TIME_MS = 60000;
const MISSING_COST_BACKFILL_INTERVAL_MS = 2500;
const MAX_STATS_FETCHES_WITHOUT_COST = 4;

interface UseProjectStatsOptions {
  enabled?: boolean;
  origin?: Project["origin"];
  backfillMissingCost?: boolean;
}

export const missingCostBackfillInterval = (
  stats: ProjectStatsResponse | undefined,
  completedFetches: number,
  enabled: boolean
): number | false => {
  if (!enabled || !stats) return false;
  const totalCost = stats.total?.total_cost;
  if (typeof totalCost === "number" && totalCost > 0) return false;
  return completedFetches < MAX_STATS_FETCHES_WITHOUT_COST
    ? MISSING_COST_BACKFILL_INTERVAL_MS
    : false;
};

export const useProjectStats = (
  projectId: Project["id"] | undefined,
  options?: UseProjectStatsOptions
) => {
  const { enabled = true, origin, backfillMissingCost = false } = options ?? {};

  return useQuery<ProjectStatsResponse | undefined>({
    queryKey: [
      ...queryKeys.projectStats.byProjectId(projectId),
      origin,
      backfillMissingCost ? "cost-backfill" : "standard"
    ],
    queryFn: () => fetchProjectStats(projectId, origin),
    enabled: enabled && !!projectId && projectId !== "undefined",
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      missingCostBackfillInterval(
        query.state.data,
        query.state.dataUpdateCount,
        backfillMissingCost
      )
  });
};
