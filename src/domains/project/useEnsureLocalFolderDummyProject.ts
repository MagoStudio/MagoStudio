import { projectsQueryOptions } from "@domains/project/useProjects";
import { isDummyProject } from "@domains/project/utils/isDummyProject";
import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { createLocalFolderDummyProjectOnce } from "./api/createLocalFolderDummyProjectOnce";

export const useEnsureLocalFolderDummyProject = () => {
  const queryClient = useQueryClient();

  return async (userId: string): Promise<Project> => {
    const loadedProjects = await queryClient.fetchQuery(projectsQueryOptions);
    const existingFolderDummyProject = loadedProjects.find((project) =>
      isDummyProject(project, userId)
    );
    if (existingFolderDummyProject) return existingFolderDummyProject;

    const createdFolderDummyProject =
      await createLocalFolderDummyProjectOnce(userId);
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    return createdFolderDummyProject;
  };
};
