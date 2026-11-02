import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";

interface Props {
  className?: string;
  statusText: string | undefined;
}

export const InProgressTrackStatus: React.FC<Props> = ({
  className,
  statusText
}) => {
  return (
    <Badge
      className={className}
      glyphColor="glyph-warning"
      startIcon={<StatusIndicator status={AssetStatus.INPROGRESS} />}
    >
      {statusText}
    </Badge>
  );
};
