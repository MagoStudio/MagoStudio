import { useProjectState } from "./data/useProjectState";
import {
  ShotsByDropped,
  partitionShotsByDropped
} from "./utils/partitionShotsByDropped";

export const useShotsByDropped = (
  projectId: string | undefined
): ShotsByDropped => {
  const { data: projectState } = useProjectState(projectId);

  return partitionShotsByDropped(projectState?.shots ?? []);
};
