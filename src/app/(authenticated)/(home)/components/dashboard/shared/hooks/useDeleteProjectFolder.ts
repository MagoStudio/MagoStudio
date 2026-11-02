import { useDeleteProject } from "@domains/project/useDeleteProject";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useProjectFolders } from "@hooks/projectFolders/useProjectFolders";
import { useUpdateProjectFolders } from "@hooks/projectFolders/useUpdateProjectFolders";
import { getAllDescendantProjectsOrFolders } from "@hooks/projectFolders/utils/getAllDescendantProjectOrFolderIds";

export const useDeleteProjectFolder = () => {
  const {
    mutateAsync: updateProjectFolders,
    isPending: isUpdatingFolders,
    error: projectFoldersUpdateError
  } = useUpdateProjectFolders();
  const {
    data,
    isLoading: isLoadingProjectFolders,
    error: projectFoldersError
  } = useProjectFolders();
  const projectFoldersAndProjects = data?.projectFoldersAndProjects;

  const {
    mutateAsync: deleteProject,
    isPending: isDeletingProject,
    error: deleteProjectError
  } = useDeleteProject({ noInvalidation: true });

  const deleteFolder = async (folderId: FolderOrProject["id"]) => {
    if (!projectFoldersAndProjects) {
      throw new Error("No project folders found");
    }

    const descendants = getAllDescendantProjectsOrFolders(
      folderId,
      projectFoldersAndProjects
    );

    const descendantsIds = descendants.map((item) => item.id);
    await Promise.all(
      descendants.map(async (descendant) => {
        if (descendant.type === "project") {
          await deleteProject({ projectId: descendant.id as string });
        }
      })
    );
    descendantsIds.push(folderId);

    const updatedProjectFolders = projectFoldersAndProjects.filter(
      (item) => !descendantsIds.includes(item.id)
    );

    await updateProjectFolders(updatedProjectFolders);
  };

  return {
    mutateAsync: deleteFolder,
    isPending:
      isLoadingProjectFolders || isUpdatingFolders || isDeletingProject,
    error:
      projectFoldersError || projectFoldersUpdateError || deleteProjectError
  };
};
