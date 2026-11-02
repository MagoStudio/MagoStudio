import { BulkRendersRunShotVideoCardState } from "./deriveBulkRendersRunShotVideoCardState";

export type BulkRendersRunShotVideoTilePresentation =
  | "black"
  | "shimmer"
  | "rendering"
  | "video"
  | "qualityFailure"
  | "infrastructureFailure";

export const deriveBulkRendersRunShotVideoTilePresentation = ({
  cardState,
  hasResolvedVideo,
  isAssetRequestInFlight
}: {
  cardState: BulkRendersRunShotVideoCardState;
  hasResolvedVideo: boolean;
  isAssetRequestInFlight: boolean;
}): BulkRendersRunShotVideoTilePresentation => {
  switch (cardState) {
    case "pending":
      return isAssetRequestInFlight ? "shimmer" : "black";
    case "rendering":
      return "rendering";
    case "ready":
      if (hasResolvedVideo) return "video";
      return isAssetRequestInFlight ? "shimmer" : "black";
    case "qualityFailure":
      return "qualityFailure";
    case "infrastructureFailure":
      return "infrastructureFailure";
  }
};
