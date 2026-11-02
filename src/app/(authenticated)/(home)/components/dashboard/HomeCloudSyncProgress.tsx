import { CircularProgress } from "@components/CircularProgress";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { mediaDownloads } from "@domains/asset/mediaDownloads";
import { useCloudProjectCatalogSyncProgress } from "@domains/scriptProject/useCloudProjectCatalogSyncProgress";
import { useIsCloudProjectSyncing } from "@domains/scriptProject/useIsCloudProjectSyncing";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const PERCENTAGE_SCALE = 100;

export const HomeCloudSyncProgress: React.FC = () => {
  const { t } = useTranslation();
  const isCloudProjectSyncing = useIsCloudProjectSyncing();
  const catalogProgress = useCloudProjectCatalogSyncProgress();
  const downloads = useSyncExternalStore(
    mediaDownloads.subscribe,
    mediaDownloads.getSnapshot,
    mediaDownloads.getSnapshot
  );
  const hasDownloadsInProgress = downloads.queued + downloads.downloading > 0;
  if (!isCloudProjectSyncing && !hasDownloadsInProgress) return null;

  const downloadTotal =
    downloads.ready +
    downloads.queued +
    downloads.downloading +
    downloads.failed;
  const label =
    catalogProgress && catalogProgress.total > 0
      ? t("status.syncing_projects.label", catalogProgress)
      : hasDownloadsInProgress
        ? t("status.downloading_offline.label", {
            ready: downloads.ready,
            total: downloadTotal
          })
        : t("status.syncing.label");
  const progress =
    catalogProgress && catalogProgress.total > 0
      ? (catalogProgress.completed / catalogProgress.total) * PERCENTAGE_SCALE
      : hasDownloadsInProgress
        ? (downloads.ready / downloadTotal) * PERCENTAGE_SCALE
        : null;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl bg-surface-secondary p-4"
      data-testid="home-cloud-sync-progress"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">
          <CircularProgress size="xs" color="glyph-secondary" />
        </span>
        <Text variant="sm" color="glyph-secondary">
          {label}
        </Text>
      </div>
      {progress !== null && (
        <ProgressBar
          progress={progress}
          color="glyph-warning"
          aria-label={label}
        />
      )}
    </div>
  );
};
