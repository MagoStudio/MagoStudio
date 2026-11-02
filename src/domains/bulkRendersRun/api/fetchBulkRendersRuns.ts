import { BulkRendersRun, BulkRendersRunSchema } from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

const isBulkRendersRunSummary = (value: unknown): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const inputSettings = (value as Record<string, unknown>).input_settings;
  if (
    !inputSettings ||
    typeof inputSettings !== "object" ||
    Array.isArray(inputSettings)
  ) {
    return false;
  }
  return Array.isArray((inputSettings as Record<string, unknown>).timeline_ids);
};

export const fetchBulkRendersRuns = async (
  projectId?: string
): Promise<BulkRendersRun[]> => {
  const response = await backendApiClient.get("/agent/plans", {
    params: projectId ? { project_id: projectId } : undefined
  });

  if (!Array.isArray(response.data)) return [];

  return response.data.reduce<BulkRendersRun[]>((parsedRuns, rawRun) => {
    // `/agent/plans` also returns scenario-agent plans. Those deliberately have
    // `timeline_ids: null` because their shots are created during the run, so
    // they are not malformed bulk runs and should be ignored without warning.
    if (!isBulkRendersRunSummary(rawRun)) return parsedRuns;

    const parsedRun = BulkRendersRunSchema.safeParse(rawRun);
    if (parsedRun.success) {
      parsedRuns.push(parsedRun.data);
    } else {
      console.warn("Dropping a malformed Bulk Renders Run", parsedRun.error);
    }
    return parsedRuns;
  }, []);
};
