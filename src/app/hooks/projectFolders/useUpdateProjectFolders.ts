import { useEnsureLocalFolderDummyProject } from "@domains/project/useEnsureLocalFolderDummyProject";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { identityMode, useUser } from "@platform/identity";
import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { isLocalApp } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

import { FolderOrProject } from "./interface";
import { useProjectFolders } from "./useProjectFolders";
import { replaceProjectSettings } from "./utils/replaceProjectSettings";

const isFolderDummyProjectCreatedByThisApp =
  isLocalApp && identityMode === "offline";

export const useUpdateProjectFolders = () => {
  const { data } = useProjectFolders();
  const folderDummyProject = data?.folderDummyProject;
  const { user } = useUser();
  const ensureLocalFolderDummyProject = useEnsureLocalFolderDummyProject();

  const mutation = useUpdateProject({
    onMutate: async (variables: {
      projectId: string;
      settings: Project["settings"];
    }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all });

      queryClient.setQueryData(
        queryKeys.projects.all,
        (oldProjects: Project[] | undefined) =>
          replaceProjectSettings(
            oldProjects,
            variables.projectId,
            variables.settings
          )
      );
    }
  });
  const queryClient = useQueryClient();

  const resolveFolderDummyProjectToUpdate = async () => {
    if (folderDummyProject) return folderDummyProject;
    if (!isFolderDummyProjectCreatedByThisApp || !user) return undefined;
    return ensureLocalFolderDummyProject(user.id);
  };

  const updateProjectFolders = async (projectFolders: FolderOrProject[]) => {
    const folderDummyProjectToUpdate =
      await resolveFolderDummyProjectToUpdate();
    if (!folderDummyProjectToUpdate) return;

    await mutation.mutateAsync({
      projectId: folderDummyProjectToUpdate.id,
      projectName: folderDummyProjectToUpdate.name,
      projectDescription: folderDummyProjectToUpdate.description,
      settings: {
        ...folderDummyProjectToUpdate.settings,
        folders: projectFolders
      },
      settingsPatch: { folders: projectFolders },
      settingsMergeBase: {
        folders: folderDummyProjectToUpdate.settings.folders ?? []
      }
    });
  };

  return {
    ...mutation,
    mutateAsync: updateProjectFolders
  };
};
