import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";

import { useProject } from "../project/useProject";

export const useShot = ({
  selectedProjectId,
  shotId
}: {
  selectedProjectId: Project["id"] | undefined;
  shotId: Shot["id"] | undefined;
}) => {
  const select = (project: Project): Shot | undefined => {
    const shot = project.timelines?.find((t) => t.id === shotId);
    return shot;
  };
  return useProject(selectedProjectId, select);
};
