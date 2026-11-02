export type ProjectGenerationCredits = {
  assetCredits: number;
  shotCredits: number;
  totalCredits: number;
};

export type EstimateProjectGenerationCreditsInput = {
  entityCount: number;
  shotCount: number;
  attemptsPerShot: number;
  creditsPerSheetImage: number | null;
  creditsPerShotRender: number;
};

export const estimateProjectGenerationCredits = ({
  entityCount,
  shotCount,
  attemptsPerShot,
  creditsPerSheetImage,
  creditsPerShotRender
}: EstimateProjectGenerationCreditsInput): ProjectGenerationCredits | null => {
  if (creditsPerSheetImage === null) return null;

  const assetCredits = entityCount * Math.ceil(creditsPerSheetImage);
  const shotCredits =
    shotCount * attemptsPerShot * Math.ceil(creditsPerShotRender);

  return {
    assetCredits,
    shotCredits,
    totalCredits: assetCredits + shotCredits
  };
};
