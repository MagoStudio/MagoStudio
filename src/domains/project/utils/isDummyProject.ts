import { Project } from "@schemas/project";

import {
  isLocalFolderDummyProject,
  OFFLINE_LOCAL_USER_ID
} from "../../../../desktop/shared/localFolderDummyProject";

export const isDummyProject = (
  project: Project,
  userId: string | undefined
): boolean => {
  if (userId === OFFLINE_LOCAL_USER_ID)
    return isLocalFolderDummyProject(project);
  return project.name === userId;
};
