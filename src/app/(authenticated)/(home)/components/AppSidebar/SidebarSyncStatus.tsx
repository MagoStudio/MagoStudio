import { CircularProgress } from "@components/CircularProgress";
import { Text } from "@components/Text";
import { mediaDownloads } from "@domains/asset/mediaDownloads";
import { useIsCloudProjectSyncing } from "@domains/scriptProject/useIsCloudProjectSyncing";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

export const SidebarSyncStatus: React.FC = () => {
  const { t } = useTranslation();
  const isCloudProjectSyncing = useIsCloudProjectSyncing();
  const downloads = useSyncExternalStore(
    mediaDownloads.subscribe,
    mediaDownloads.getSnapshot,
    mediaDownloads.getSnapshot
  );
  const hasOfflineDownloadsInProgress =
    downloads.queued + downloads.downloading > 0;

  if (!isCloudProjectSyncing && !hasOfflineDownloadsInProgress) return null;

  return (
    <div
      className="flex items-center gap-2 h-10 px-3"
      data-testid="cloud-project-sync-indicator"
    >
      <CircularProgress size="xs" color="glyph-tertiary" />
      <Text variant="xs" color="glyph-tertiary">
        {hasOfflineDownloadsInProgress
          ? t("status.downloading_offline.label", {
              ready: downloads.ready,
              total:
                downloads.ready +
                downloads.queued +
                downloads.downloading +
                downloads.failed
            })
          : t("status.syncing.label")}
      </Text>
    </div>
  );
};
