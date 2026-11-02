import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";

import { useSelectedShotId } from "./useSelectedShotId";
import { useShot } from "./useShot";

export const useSelectedShot = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  return useShot({
    selectedProjectId,
    shotId: selectedShotId
  });
};
