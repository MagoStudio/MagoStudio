import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useExpandedFolders } from "@hooks/projectFolders/useExpandedFolders";
import { useProjectFolders } from "@hooks/projectFolders/useProjectFolders";
import { useUpdateProjectFolders } from "@hooks/projectFolders/useUpdateProjectFolders";
import { currentFolderIdAtom } from "@store/atoms";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";

export const useCreateProjectFoldersFolder = () => {
  const currentFolderId = useAtomValue(currentFolderIdAtom);
  const { mutateAsync: updateFolders } = useUpdateProjectFolders();
  const { expandFolder } = useExpandedFolders();

  const { data, isLoading, error: projectFoldersError } = useProjectFolders();
  const projectFoldersAndProjects = data?.projectFoldersAndProjects;

  const createProjectFoldersFolder = async (parentFolderId?: string) => {
    const newFolder: FolderOrProject = {
      id: crypto.randomUUID(),
      name: "New Folder",
      parentFolderId: parentFolderId ?? currentFolderId ?? "",
      type: "folder",
      createdAt: dayjs().unix()
    };

    const updatedProjectFolders = projectFoldersAndProjects
      ? [...projectFoldersAndProjects, newFolder]
      : [newFolder];

    await updateFolders(updatedProjectFolders);
    expandFolder(newFolder.id);

    return newFolder;
  };

  return {
    mutateAsync: createProjectFoldersFolder,
    isPending: isLoading,
    error: projectFoldersError
  };
};
