export interface EstimateBulkRendersRunCreditsInput {
  imageCreditsByShotId: Record<string, number>;
  videoCreditsByShotId: Record<string, number>;
  selectedShotIds: string[];
  shotIdsWithUploadedFirstFrame: Set<string>;
}

export const estimateBulkRendersRunCredits = ({
  imageCreditsByShotId,
  videoCreditsByShotId,
  selectedShotIds,
  shotIdsWithUploadedFirstFrame
}: EstimateBulkRendersRunCreditsInput): number =>
  selectedShotIds.reduce((runCredits, shotId) => {
    const hasUploadedFirstFrame = shotIdsWithUploadedFirstFrame.has(shotId);
    const shotImageCredits = hasUploadedFirstFrame
      ? 0
      : Math.ceil(imageCreditsByShotId[shotId] ?? 0);

    return (
      runCredits +
      shotImageCredits +
      Math.ceil(videoCreditsByShotId[shotId] ?? 0)
    );
  }, 0);
