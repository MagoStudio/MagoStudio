import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { resolveTrackRenderErrorMessage } from "@domains/track/utils/resolveTrackRenderErrorMessage";
import { useQueue } from "@hooks/queue/useQueue";
import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";

import { CancelledTrackStatus } from "../../../../../status/CancelledTrackStatus";
import { DoneTrackStatus } from "../../../../../status/DoneTrackStatus";
import { ErrorTrackStatus } from "../../../../../status/ErrorTrackStatus";
import { InProgressTrackStatus } from "../../../../../status/InprogressTrackStatus";
import { InQueueTrackStatus } from "../../../../../status/InQueueTrackStatus";
import { WaitingTrackStatus } from "../../../../../status/WaitingTrackStatus";

interface Props {
  className?: string;
  track: Layer;
  shouldDisplayDoneIndicator: boolean;
}

export const RenderStatus: React.FC<Props> = ({
  className,
  track,
  shouldDisplayDoneIndicator
}) => {
  const { isLoading } = useQueue();
  const clip = getTrackClip(track);

  const { status, statusText, queueItem } = useResolvedQueueStatus({
    trackId: track.id,
    assetStatus: getTrackAssetData(track)?.queue_status
  });

  const positionInQueue = queueItem?.display_order;

  if (isLoading || !clip) {
    return null;
  }

  const renderStatusIndicator = () => {
    switch (status) {
      case AssetStatus.FINISHED:
        return shouldDisplayDoneIndicator && <DoneTrackStatus />;
      case AssetStatus.PENDING:
        return (
          <WaitingTrackStatus
            className={className}
            positionInQueue={positionInQueue}
          />
        );
      case AssetStatus.ERROR: {
        const errorMessage = resolveTrackRenderErrorMessage({
          assetError: getTrackAssetData(track)?.error,
          queueItem: queueItem ?? undefined
        });

        return (
          <ErrorTrackStatus
            queueItem={queueItem || undefined}
            errorMessage={errorMessage}
          />
        );
      }
      case AssetStatus.INPROGRESS:
        return queueItem ? (
          <InProgressTrackStatus
            className={className}
            statusText={statusText}
          />
        ) : null;
      case AssetStatus.INQUEUE:
        return (
          <InQueueTrackStatus
            className={className}
            positionInQueue={positionInQueue}
          />
        );
      case AssetStatus.CANCELLED:
        return <CancelledTrackStatus />;
      default:
        return null;
    }
  };

  return <>{renderStatusIndicator()}</>;
};
