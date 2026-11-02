import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { Layer } from "@schemas/layer";

import { ImageToVideoRenderActions } from "./ImageToVideoRenderActions";
import { ImageToVideoRenderHeader } from "./ImageToVideoRenderHeader";
import { ImageToVideoRenderPlayer } from "./ImageToVideoRenderPlayer";

interface ImageToVideoRenderProps {
  track: Layer;
  selectedProjectId: string | undefined;
  containerShotId: string | undefined;
}

export const ImageToVideoRender: React.FC<ImageToVideoRenderProps> = ({
  track,
  selectedProjectId,
  containerShotId
}) => {
  const assetId = getTrackClip(track)?.asset_id;
  const { status, statusText, isFinished, isStatusError, isCancelled } =
    useResolvedQueueStatus({
      trackId: track.id,
      assetStatus: getTrackAssetData(track)?.queue_status,
      shotIdOverride: containerShotId
    });
  const isAwaitingRenderResult = !isFinished && !isStatusError && !isCancelled;
  const shouldResolveRenderVideoUrl = !isStatusError && !isCancelled;

  return (
    <div
      id={`image-to-video-generation-${track.id}`}
      data-testid={`image-to-video-generation-${track.id}`}
      className="flex flex-col gap-2 rounded bg-element-primary p-2"
    >
      <ImageToVideoRenderHeader
        track={track}
        containerShotId={containerShotId}
        status={status}
        statusText={statusText}
      />
      <ImageToVideoRenderPlayer
        track={track}
        assetId={assetId}
        isFailed={isStatusError}
        isAwaitingRenderResult={isAwaitingRenderResult}
        shouldResolveRenderVideoUrl={shouldResolveRenderVideoUrl}
      />
      <ImageToVideoRenderActions
        track={track}
        assetId={assetId}
        status={status}
        selectedProjectId={selectedProjectId}
      />
    </div>
  );
};
