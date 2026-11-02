import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";

import { useProject } from "../../project/useProject";

export const useGetTrackById = ({
  trackId,
  selectedProjectId,
  selectedShotId,
  disabled = false
}: {
  trackId: string | undefined;
  selectedProjectId: string | undefined;
  selectedShotId: string | undefined;
  disabled?: boolean;
}) => {
  const select = (project: Project): Layer | undefined => {
    const shot = project.timelines?.find((t) => t.id === selectedShotId);
    return shot?.layers?.find((l) => l.id === trackId);
  };
  return useProject(selectedProjectId, select, disabled);
};
