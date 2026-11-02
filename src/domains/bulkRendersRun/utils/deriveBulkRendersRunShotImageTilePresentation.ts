import { BulkRendersRunShotImageCardState } from "./deriveBulkRendersRunShotImageCardState";

export type BulkRendersRunShotImageTilePresentation =
  | "black"
  | "shimmer"
  | "rendering"
  | "image"
  | "qualityFailure"
  | "infrastructureFailure";

export const deriveBulkRendersRunShotImageTilePresentation = ({
  cardState,
  hasResolvedImage,
  isAssetRequestInFlight
}: {
  cardState: BulkRendersRunShotImageCardState;
  hasResolvedImage: boolean;
  isAssetRequestInFlight: boolean;
}): BulkRendersRunShotImageTilePresentation => {
  switch (cardState) {
    case "pending":
      return isAssetRequestInFlight ? "shimmer" : "black";
    case "rendering":
      return "rendering";
    case "ready":
      if (hasResolvedImage) return "image";
      return isAssetRequestInFlight ? "shimmer" : "black";
    case "qualityFailure":
      return "qualityFailure";
    case "infrastructureFailure":
      return "infrastructureFailure";
  }
};
