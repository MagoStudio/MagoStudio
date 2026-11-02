export const isLocallyRunPlan = (
  plan: Record<string, unknown> | null | undefined
): plan is Record<string, unknown> =>
  typeof plan?.local_operation === "string" && plan.local_operation !== "";
