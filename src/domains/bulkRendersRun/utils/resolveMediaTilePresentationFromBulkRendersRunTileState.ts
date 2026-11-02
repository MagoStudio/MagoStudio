import { MediaTilePresentation } from "@components/MediaTile";

import { BulkRendersRunShotImageTilePresentation } from "./deriveBulkRendersRunShotImageTilePresentation";
import { BulkRendersRunShotVideoReferenceFrameTilePresentation } from "./deriveBulkRendersRunShotVideoReferenceFrameTilePresentation";
import { BulkRendersRunShotVideoTilePresentation } from "./deriveBulkRendersRunShotVideoTilePresentation";

type BulkRendersRunTileState =
  | BulkRendersRunShotImageTilePresentation
  | BulkRendersRunShotVideoTilePresentation
  | BulkRendersRunShotVideoReferenceFrameTilePresentation;

export const resolveMediaTilePresentationFromBulkRendersRunTileState = (
  tileState: BulkRendersRunTileState
): MediaTilePresentation => {
  switch (tileState) {
    case "black":
    case "shimmer":
    case "rendering":
      return tileState;
    default:
      return "asset";
  }
};
