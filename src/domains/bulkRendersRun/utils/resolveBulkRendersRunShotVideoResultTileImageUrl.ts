import { BulkRendersRunShotVideoCardState } from "./deriveBulkRendersRunShotVideoCardState";

export const resolveBulkRendersRunShotVideoResultTileImageUrl = ({
  cardState,
  shotPreviewUrl,
  videoResultFrameUrl
}: {
  cardState: BulkRendersRunShotVideoCardState;
  shotPreviewUrl: string | undefined;
  videoResultFrameUrl: string | undefined;
}): string | undefined => {
  if (cardState === "pending") return shotPreviewUrl;
  if (cardState === "ready") return videoResultFrameUrl;
  return undefined;
};
