import { SidebarMenuButton } from "@components/SidebarMenuButton";
import { BulkRendersRunActivityCounts } from "@domains/bulkRendersRun/utils/countBulkRendersRunsByActivity";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
  isSelected: boolean;
  activityCounts: BulkRendersRunActivityCounts;
}

export const BulkRenderingNavButton: React.FC<Props> = ({
  onClick,
  isSelected,
  activityCounts
}) => {
  const { t } = useTranslation();
  const { runningRunCount, waitingRunCount } = activityCounts;

  return (
    <SidebarMenuButton
      aria-label={t("bulk_rendering.navbar_entry.label")}
      onClick={onClick}
      selected={isSelected}
    >
      <div className="flex items-center gap-2">
        {t("bulk_rendering.navbar_entry.label")}
        <div className="flex items-center gap-1">
          {runningRunCount > 0 && (
            <span
              className="flex items-center text-glyph-warning"
              data-testid="bulk-rendering-nav-running-count"
            >
              <span className="-mr-0.5">{runningRunCount}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.INPROGRESS} />
              </span>
            </span>
          )}
          {waitingRunCount > 0 && (
            <span
              className="flex items-center text-glyph-primary"
              data-testid="bulk-rendering-nav-waiting-count"
            >
              <span className="-mr-0.5">{waitingRunCount}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.INQUEUE} />
              </span>
            </span>
          )}
        </div>
      </div>
    </SidebarMenuButton>
  );
};
