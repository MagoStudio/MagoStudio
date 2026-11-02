import { Badge } from "@components/Badge";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

type DoneTrackStatusProps = {
  className?: string;
};

export const DoneTrackStatus: React.FC<DoneTrackStatusProps> = ({
  className
}) => {
  const { t } = useTranslation();

  return (
    <Badge
      className={className}
      glyphColor="glyph-success"
      startIcon={<StatusIndicator status={AssetStatus.FINISHED} />}
    >
      {t("status.done.label")}
    </Badge>
  );
};
