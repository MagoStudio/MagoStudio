import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

import { getQueueStatusLabel } from "../getQueueStatusLabel";

type InQueueTrackStatusProps = {
  className?: string;
  positionInQueue?: number;
};

export const InQueueTrackStatus: React.FC<InQueueTrackStatusProps> = ({
  className,
  positionInQueue
}) => {
  const { t } = useTranslation();

  const label = getQueueStatusLabel(positionInQueue, t);

  if (label === undefined) {
    return null;
  }

  return (
    <Badge
      className={className}
      glyphColor="glyph-primary"
      startIcon={<StatusIndicator status={AssetStatus.INPROGRESS} />}
      aria-label={label}
    >
      {label}
    </Badge>
  );
};
