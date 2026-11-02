import { useQueryClient } from "@tanstack/react-query";
import { useInterval } from "usehooks-ts";

import { queryKeys } from "@/queryKeys";

const PROJECT_REFRESH_INTERVAL_MS = 10000;

export const useRefreshProjectWhileRunIsActive = ({
  projectId,
  isRunActive
}: {
  projectId: string | undefined;
  isRunActive: boolean;
}) => {
  const queryClient = useQueryClient();

  useInterval(
    () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(projectId)
      });
    },
    isRunActive && !!projectId ? PROJECT_REFRESH_INTERVAL_MS : null
  );
};
