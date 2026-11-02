export type BulkRendersRunShotVideoReferenceFrameTilePresentation =
  | "black"
  | "shimmer"
  | "image";

export const deriveBulkRendersRunShotVideoReferenceFrameTilePresentation = ({
  hasReferenceFrameAssetId,
  hasResolvedReferenceFrame,
  isAssetRequestInFlight
}: {
  hasReferenceFrameAssetId: boolean;
  hasResolvedReferenceFrame: boolean;
  isAssetRequestInFlight: boolean;
}): BulkRendersRunShotVideoReferenceFrameTilePresentation => {
  if (hasResolvedReferenceFrame) return "image";
  if (!hasReferenceFrameAssetId) return "black";

  return isAssetRequestInFlight ? "shimmer" : "black";
};
