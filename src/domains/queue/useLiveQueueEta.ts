import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { useEffect, useState } from "react";

import { getLiveQueueEta } from "./utils/getLiveQueueEta";

const COUNTDOWN_INTERVAL_MS = 1000;

export const useLiveQueueEta = (
  queueItem: QueueItem | undefined
): number | undefined => {
  const [now, setNow] = useState(() => Date.now());
  const shouldTick =
    queueItem?.status === AssetStatus.INPROGRESS &&
    !!queueItem.estimated_end_time;

  useEffect(() => {
    if (!shouldTick) return;
    const timer = window.setInterval(
      () => setNow(Date.now()),
      COUNTDOWN_INTERVAL_MS
    );
    return () => window.clearInterval(timer);
  }, [queueItem?.estimated_end_time, shouldTick]);

  return getLiveQueueEta(queueItem, now);
};
