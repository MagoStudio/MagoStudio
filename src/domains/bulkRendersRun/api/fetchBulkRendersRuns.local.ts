import { BulkRendersRun, BulkRendersRunSchema } from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

import { listLocalBulkRendersRuns } from "./localBulkRendersRun";

const hasRawTimelineList = (run: unknown): boolean => {
  if (!run || typeof run !== "object" || Array.isArray(run)) return false;
  const inputSettings = (run as Record<string, unknown>).input_settings;
  return (
    !!inputSettings &&
    typeof inputSettings === "object" &&
    Array.isArray((inputSettings as Record<string, unknown>).timeline_ids)
  );
};

const parseCloudRuns = (value: unknown): BulkRendersRun[] =>
  !Array.isArray(value)
    ? []
    : value.flatMap((run) => {
        if (!hasRawTimelineList(run)) return [];
        const parsed = BulkRendersRunSchema.safeParse(run);
        return parsed.success ? [parsed.data] : [];
      });

export const fetchBulkRendersRuns = async (
  projectId?: string
): Promise<BulkRendersRun[]> => {
  const desktop = typeof window === "undefined" ? undefined : window.mago;
  if (!desktop) {
    const response = await backendApiClient.get("/agent/plans", {
      params: projectId ? { project_id: projectId } : undefined
    });
    return parseCloudRuns(response.data);
  }
  // Local project plans are authoritative on disk, even while signed in.
  // Waiting for a cloud history request here stalls the local history panel.
  if (
    desktop.account.mode === "cloud" &&
    projectId &&
    (await desktop.projects.get(projectId))?.origin === "local"
  )
    return listLocalBulkRendersRuns(projectId);
  const localRunsPromise = listLocalBulkRendersRuns(projectId);
  if (desktop.account.mode !== "cloud") return localRunsPromise;

  const [localRuns, cloudResult] = await Promise.all([
    localRunsPromise,
    backendApiClient
      .get("/agent/plans", {
        params: projectId ? { project_id: projectId } : undefined
      })
      .then((response) => parseCloudRuns(response.data))
      .catch((error: unknown) => {
        console.warn("Could not load cloud bulk-render history", error);
        return [];
      })
  ]);
  const runsById = new Map(
    [...cloudResult, ...localRuns].map((run) => [run.id, run])
  );
  return [...runsById.values()];
};
