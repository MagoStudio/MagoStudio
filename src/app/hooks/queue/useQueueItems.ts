import { useProjects } from "@domains/project/useProjects";

import { QueueItem } from "./interface";
import { useQueue } from "./useQueue";

export const useQueueItems = (): {
  queueItems: QueueItem[] | undefined;
  isInitialLoading: boolean;
} => {
  const { data: allQueueItems, isLoading: isQueueLoading } = useQueue();
  const { data: projects, isLoading: areProjectsLoading } = useProjects();

  // A Mago cloud render belongs to a cloud project the local project list
  // does not contain, so it is shown on its provider rather than dropped.
  const queueItems = allQueueItems?.filter(
    (item) =>
      item.render_provider === "mago-cloud" ||
      projects?.some((project) => project.id === item.project_id)
  );

  return {
    queueItems,
    isInitialLoading: isQueueLoading || areProjectsLoading
  };
};
