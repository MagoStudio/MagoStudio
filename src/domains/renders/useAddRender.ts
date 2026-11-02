import { useCloudSyncProgressToast } from "@domains/cloud/useCloudSyncProgressToast";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { trackingUtils } from "@hooks/tracking/trackingUtils";

import { PostRenderParams } from "./api/postRender";
import { usePostRender } from "./data/usePostRender";

export const useAddRender = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const { onProgress, dismiss } = useCloudSyncProgressToast();

  const mutation = usePostRender({
    selectedProjectId,
    selectedShotId,
    onProgress
  });

  return {
    ...mutation,
    mutateAsync: async (params: PostRenderParams) => {
      void Notification.requestPermission().then((permission) => {
        trackingUtils.magoActions.notificationPermission(permission);
      });
      try {
        return await mutation.mutateAsync(params);
      } finally {
        dismiss();
      }
    }
  };
};
