import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";

import { usePutTrack } from "./data/usePutTrack";

export const useUpdateTrack = (options?: { shotIdOverride?: string }) => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  return usePutTrack({
    selectedProjectId,
    selectedShotId: options?.shotIdOverride ?? selectedShotId
  });
};
