import { readScriptProjectSnapshot } from "@domains/scriptProject/scriptProjectSnapshot";
import {
  BulkRendersRun,
  BulkRendersRunDetail,
  BulkRendersRunDetailSchema,
  BulkRendersRunSchema,
  BulkRendersRunStep,
  BulkRendersRunStepListSchema
} from "@schemas/bulkRendersRun";

import { getLocalDesktopApi } from "@/platform/localDesktop";

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Adapts the durable desktop plan to the production bulk-render summary contract. The local
 * service intentionally stores the full request as `input_data`; the production list endpoint
 * calls the corresponding summary field `input_settings`. */
export const parseLocalBulkRendersRun = (
  value: unknown
): BulkRendersRun | null => {
  const plan = record(value);
  if (!plan || !["sheets", "shots"].includes(String(plan.local_operation)))
    return null;
  const inputData = record(plan.input_data) ?? {};
  const parsed = BulkRendersRunSchema.safeParse({
    ...plan,
    parent_plan_id: plan.parent_plan_id ?? null,
    input_settings: {
      ...inputData,
      timeline_ids: Array.isArray(inputData.timeline_ids)
        ? inputData.timeline_ids
        : []
    }
  });
  return parsed.success ? parsed.data : null;
};

export const listLocalBulkRendersRuns = async (
  projectId?: string
): Promise<BulkRendersRun[]> => {
  const desktop = getLocalDesktopApi();
  const relevantProjects = projectId
    ? [await desktop.projects.get(projectId)].filter(
        (project) => project !== null
      )
    : await desktop.projects.list();
  const snapshots = await Promise.all(
    relevantProjects.map((project) => readScriptProjectSnapshot(project.id))
  );

  return snapshots.flatMap((snapshot) =>
    Object.values(snapshot?.planDetails ?? {}).flatMap((plan) => {
      const parsed = parseLocalBulkRendersRun(plan);
      return parsed ? [parsed] : [];
    })
  );
};

export const getLocalBulkRendersRun = async (
  bulkRunId: string
): Promise<Record<string, unknown> | null> => {
  const plan = await getLocalDesktopApi().scriptProjects.getPlan(bulkRunId);
  return parseLocalBulkRendersRun(plan) ? plan : null;
};

export const parseLocalBulkRendersRunSteps = (
  plan: Record<string, unknown>
): BulkRendersRunStep[] =>
  BulkRendersRunStepListSchema.parse(
    Array.isArray(plan.steps) ? plan.steps : []
  );

export const parseLocalBulkRendersRunDetail = (
  plan: Record<string, unknown>
): BulkRendersRunDetail => BulkRendersRunDetailSchema.parse(plan);
