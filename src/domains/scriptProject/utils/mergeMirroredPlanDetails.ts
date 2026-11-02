type PlanDetailsById = Record<string, Record<string, unknown>>;

export const mergeMirroredPlanDetails = ({
  listedPlanIds,
  fetchedPlanDetails,
  cachedPlanDetails
}: {
  listedPlanIds: string[];
  fetchedPlanDetails: PlanDetailsById;
  cachedPlanDetails: PlanDetailsById | null;
}): PlanDetailsById =>
  Object.fromEntries(
    listedPlanIds.flatMap((planId) => {
      const planDetail =
        fetchedPlanDetails[planId] ?? cachedPlanDetails?.[planId];
      return planDetail ? [[planId, planDetail] as const] : [];
    })
  );
