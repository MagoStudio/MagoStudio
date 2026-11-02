import { TooltipIcon } from "@components/TooltipIcon";
import { EMAILS } from "@config/companyData";
import { QueueItem } from "@hooks/queue/interface";
import { useTooltip } from "@hooks/useTooltip";
import Link from "next/link";

interface Props {
  queueItem?: QueueItem;
  errorMessage?: string;
}

export const TrackRenderErrorToolTip: React.FC<Props> = ({
  queueItem,
  errorMessage
}) => {
  const { visible, showTooltip, hideTooltip } = useTooltip();
  const errorType = queueItem?.error?.error_type?.split(".").pop();
  const isOutOfMemoryError = errorType === "OutOfMemoryError";

  const getTooltipContent = () => {
    if (isOutOfMemoryError) {
      return (
        errorMessage ??
        "ComfyUI ran out of GPU memory. Reduce the output size or select a smaller model."
      );
    }
    if (errorMessage) {
      return errorMessage;
    }
    return (
      <>
        If the error continues to appear, please{" "}
        <Link href={`mailto:${EMAILS.SUPPORT_EMAIL}`}>contact support</Link>
      </>
    );
  };

  return (
    <div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      <TooltipIcon isVisible={visible} variant="error" iconColor="glyph-error">
        {getTooltipContent()}
      </TooltipIcon>
    </div>
  );
};
