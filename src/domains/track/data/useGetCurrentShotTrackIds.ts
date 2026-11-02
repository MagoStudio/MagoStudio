import { Project } from "@schemas/project";

import { useProject } from "../../project/useProject";

export const useGetCurrentShotTrackIds = ({
  selectedProjectId,
  selectedShotId
}: {
  selectedProjectId?: string;
  selectedShotId?: string;
}) => {
  const select = (project: Project) => {
    const shot = project.timelines?.find((t) => t.id === selectedShotId);
    return shot?.layers.map((l) => l.id) || [];
  };
  return useProject(selectedProjectId, select);
};
