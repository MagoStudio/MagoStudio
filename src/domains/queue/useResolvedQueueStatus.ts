import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

import { useLiveQueueEta } from "./useLiveQueueEta";
import { useQueueItemForTrack } from "./useQueueItemForTrack";
import { getQueueStatusText } from "./utils/getQueueStatusText";

export const useResolvedQueueStatus = ({
  trackId,
  assetStatus,
  shotIdOverride
}: {
  trackId: string | undefined;
  assetStatus: AssetStatus | undefined;
  shotIdOverride?: string;
}) => {
  const { t } = useTranslation();
  const { data: queueItem } = useQueueItemForTrack({ trackId, shotIdOverride });

  const status = queueItem?.status ?? assetStatus;

  const eta = useLiveQueueEta(queueItem);
  const statusText = queueItem
    ? getQueueStatusText(queueItem, eta, t)
    : undefined;

  return {
    status,
    statusText,
    eta,
    queueItem,
    isFinished: status === AssetStatus.FINISHED,
    isInProgress: status === AssetStatus.INPROGRESS,
    isStatusPending: status === AssetStatus.PENDING,
    isStatusError: status === AssetStatus.ERROR,
    isCancelled: status === AssetStatus.CANCELLED
  };
};
