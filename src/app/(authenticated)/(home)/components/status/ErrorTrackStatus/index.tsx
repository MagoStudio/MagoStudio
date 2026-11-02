import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { type QueueItem } from "@hooks/queue/interface";
import { useTooltip } from "@hooks/useTooltip";
import { AssetStatus } from "@schemas/asset";

import { TrackRenderErrorToolTip } from "./TrackRenderErrorToolTip";

export type ErrorTrackStatusProps = {
  className?: string;
  queueItem?: QueueItem;
  errorMessage?: string;
};

export const ErrorTrackStatus: React.FC<ErrorTrackStatusProps> = ({
  className,
  queueItem,
  errorMessage
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const errorType = queueItem?.error?.error_type?.split(".").pop();
  const isOutOfMemoryError = errorType === "OutOfMemoryError";

  const resolvedErrorMessage =
    errorMessage || queueItem?.error?.error_message || undefined;
  const hasKnownError = isOutOfMemoryError || !!resolvedErrorMessage;

  const getDisplayText = () => {
    if (isOutOfMemoryError) return "Out of memory";
    if (hasKnownError) return "Error";
    return "Unknown Error";
  };

  return (
    <Badge
      className={className}
      endIcon={
        <TrackRenderErrorToolTip
          queueItem={queueItem}
          errorMessage={resolvedErrorMessage}
        />
      }
      glyphColor="glyph-error"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      startIcon={<StatusIndicator status={AssetStatus.ERROR} />}
    >
      {getDisplayText()}
    </Badge>
  );
};
