import { useQuery } from "@tanstack/react-query";

import { readScriptProjectSnapshot } from "./scriptProjectSnapshot";

type RecoverableCastingRun = {
  planId: string;
  status: string;
};

const POLL_INTERVAL_MS = 3000;
const RECOVERABLE_STATUSES = new Set(["PENDING", "RUNNING", "PAUSED"]);
const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const findRecoverableCastingRun = (
  planDetails: Record<string, Record<string, unknown>> | null | undefined
): RecoverableCastingRun | null => {
  const plans = Object.values(planDetails ?? {})
    .filter(
      (plan) =>
        plan.local_operation === "cast" &&
        typeof plan.id === "string" &&
        typeof plan.status === "string" &&
        RECOVERABLE_STATUSES.has(plan.status) &&
        isRecord(plan.local_request) &&
        typeof plan.local_request.script === "string"
    )
    .sort((left, right) =>
      stringValue(right.created_at).localeCompare(stringValue(left.created_at))
    );
  const latest = plans[0];
  return latest
    ? { planId: String(latest.id), status: String(latest.status) }
    : null;
};

export const useRecoverableCastingRun = (
  projectId: string
): RecoverableCastingRun | null => {
  const { data } = useQuery({
    queryKey: ["local-script-project-casting-run", projectId],
    queryFn: async () =>
      findRecoverableCastingRun(
        (await readScriptProjectSnapshot(projectId))?.planDetails
      ),
    enabled: !!projectId,
    refetchInterval: (query) =>
      query.state.data && ACTIVE_STATUSES.has(query.state.data.status)
        ? POLL_INTERVAL_MS
        : false
  });

  return data ?? null;
};
