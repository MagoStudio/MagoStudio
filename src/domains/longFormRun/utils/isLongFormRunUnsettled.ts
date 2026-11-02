import { ACTIVE_PLAN_STATUSES } from "@domains/plan/utils/planStatuses";
import { PlanStatus } from "@schemas/plan";

export const isLongFormRunUnsettled = (
  status: PlanStatus | undefined
): boolean => !!status && ACTIVE_PLAN_STATUSES.has(status);
