import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

type CancelledTrackStatusProps = {
  className?: string;
};

export const CancelledTrackStatus: React.FC<CancelledTrackStatusProps> = ({
  className
}) => {
  const { t } = useTranslation();

  return (
    <Badge
      className={className}
      glyphColor="glyph-secondary"
      startIcon={<StatusIndicator status={AssetStatus.CANCELLED} />}
    >
      {t("status.cancelled.label")}
    </Badge>
  );
};
