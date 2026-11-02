import { ShotState } from "@schemas/scriptProject";

export const countShotReferenceImages = (
  shot: ShotState,
  { isContinuationSent }: { isContinuationSent: boolean }
): number => {
  const taggedReferenceImageCount = Object.values(shot.references).reduce(
    (totalReferenceImages, referencesForEntity) =>
      totalReferenceImages + referencesForEntity.length,
    0
  );

  return taggedReferenceImageCount + (isContinuationSent ? 1 : 0);
};
