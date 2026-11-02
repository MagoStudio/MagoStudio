import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useProjectFolders } from "@hooks/projectFolders/useProjectFolders";
import { useUpdateProjectFolders } from "@hooks/projectFolders/useUpdateProjectFolders";

export const useRenameProjectFolder = () => {
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
  const projectFoldersAndProjects = data?.projectFoldersAndProjects || [];

  const renameFolder = async ({
    folderId,
    newName
  }: {
    folderId: FolderOrProject["id"];
    newName: string;
  }) => {
    if (!projectFoldersAndProjects) {
      throw new Error("No project folders found");
    }

    const updatedProjectFolders = projectFoldersAndProjects.map(
      (projectOrFolder: FolderOrProject) =>
        projectOrFolder.id === folderId
          ? { ...projectOrFolder, name: newName }
          : projectOrFolder
    );

    await updateProjectFolders(updatedProjectFolders);
  };

  return {
    mutateAsync: renameFolder,
    isPending: isLoadingProjectFolders || isUpdatingFolders,
    error: projectFoldersError || projectFoldersUpdateError
  };
};
