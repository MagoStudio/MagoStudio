import { QueueItem } from "@hooks/queue/interface";

import { isOnboardingProjectName } from "./onboardingProjectName";

type QueueItemProjectRef = Pick<QueueItem, "project_id" | "project_name">;

export const hasOnboardingRenderInQueue = (
  queueItems: QueueItemProjectRef[],
  baselineProjectIds: string[]
): boolean =>
  queueItems.some(
    (item) =>
      isOnboardingProjectName(item.project_name) &&
      !baselineProjectIds.includes(item.project_id)
  );
