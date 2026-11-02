import { Project } from "@schemas/project";
import { currentFolderIdAtom } from "@store/atoms";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";

import { FolderOrProject } from "./interface";
import { useProjectFolders } from "./useProjectFolders";
import { useUpdateProjectFolders } from "./useUpdateProjectFolders";

export const useCreateProjectFoldersProject = () => {
  const currentFolderId = useAtomValue(currentFolderIdAtom);
  const { mutateAsync: updateFolders } = useUpdateProjectFolders();

  const { data, isLoading, error: projectFoldersError } = useProjectFolders();
  const projectFoldersAndProjects = data?.projectFoldersAndProjects;

  const createProjectFoldersProject = async ({
    projectId,
    projectName,
    parentFolderId
  }: {
    projectId: Project["id"];
    projectName: Project["name"];
    parentFolderId?: string;
  }) => {
    const newProject: FolderOrProject = {
      id: projectId,
      name: projectName,
      parentFolderId: parentFolderId ?? currentFolderId ?? "",
      type: "project",
      createdAt: dayjs().unix()
    };

    const updatedProjectFolders = projectFoldersAndProjects
      ? [...projectFoldersAndProjects, newProject]
      : [newProject];

    return updateFolders(updatedProjectFolders);
  };

  return {
    mutateAsync: createProjectFoldersProject,
    isPending: isLoading,
    error: projectFoldersError
  };
};
