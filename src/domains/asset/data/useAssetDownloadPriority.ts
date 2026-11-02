/* oxlint-disable custom-react/no-use-effect -- visibility leases synchronize an external download queue */
import { useEffect, useSyncExternalStore } from "react";

import {
  mediaDownloads,
  DOWNLOAD_PRIORITY
} from "../utils/mediaDownloadScheduler";

export const useAssetDownloadPriority = (
  assetId: string | null | undefined,
  enabled: boolean,
  priority: number = DOWNLOAD_PRIORITY.visible
) => {
  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- current visibility is a lease in an external queue */
  useEffect(() => {
    if (assetId && enabled) return mediaDownloads.demand(assetId, priority);
  }, [assetId, enabled, priority]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */
};

export const useAssetDownloadState = (assetId: string | null | undefined) =>
  useSyncExternalStore(
    mediaDownloads.subscribe,
    () => (assetId ? mediaDownloads.getAssetState(assetId) : undefined),
    () => undefined
  );
