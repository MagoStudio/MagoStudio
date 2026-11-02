import type { PlanStatus } from "@schemas/plan";

export const plans = {
  all: ["plans"] as const,
  list: (status: PlanStatus | undefined, projectId: string | undefined) =>
    [...plans.all, status, projectId] as const
};

export const planProgress = {
  byId: (planId: string) => ["planProgress", planId] as const
};

export const planSteps = {
  byId: (planId: string) => ["planSteps", planId] as const
};

export const planDetail = {
  byId: (planId: string) => ["planDetail", planId] as const
};
