import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

import { getQueueStatusLabel } from "../getQueueStatusLabel";

type WaitingTrackStatusProps = {
  className?: string;
  positionInQueue?: number;
};

export const WaitingTrackStatus: React.FC<WaitingTrackStatusProps> = ({
  className,
  positionInQueue
}) => {
  const { t } = useTranslation();

  const statusText = getQueueStatusLabel(positionInQueue, t);

  if (statusText === undefined) {
    return null;
  }

  return (
    <Badge
      className={className}
      glyphColor="glyph-primary"
      startIcon={<StatusIndicator status={AssetStatus.PENDING} />}
    >
      {statusText}
    </Badge>
  );
};
