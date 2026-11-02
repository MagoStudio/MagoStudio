interface SumPlanCostArgs {
  selectedIds: string[];
  img2imgCostPerShot: number;
  fullShots: boolean;
  sharedVideoCostPerShot: number;
  fullShotVideoCostById: Record<string, number>;
  shotIdsSkippingImg2Img?: ReadonlySet<string>;
}

export const sumPlanCost = ({
  selectedIds,
  img2imgCostPerShot,
  fullShots,
  sharedVideoCostPerShot,
  fullShotVideoCostById,
  shotIdsSkippingImg2Img
}: SumPlanCostArgs): number =>
  selectedIds.reduce((total, id) => {
    const videoCost = fullShots
      ? (fullShotVideoCostById[id] ?? 0)
      : sharedVideoCostPerShot;
    const img2imgCost = shotIdsSkippingImg2Img?.has(id)
      ? 0
      : img2imgCostPerShot;
    return total + Math.ceil(img2imgCost) + Math.ceil(videoCost);
  }, 0);
