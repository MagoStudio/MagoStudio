import { RenderSnapshot } from "@domains/queue/utils/findRendersThatJustEnded";
import { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

export const invalidateCachesForEndedRenders = ({
  queryClient,
  endedRenders
}: {
  queryClient: QueryClient;
  endedRenders: RenderSnapshot[];
}) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.project.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.timelineList.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.projectCut.all });

  endedRenders.forEach((endedRender) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.videoAsset.byId(endedRender.assetId)
    });
  });
};
