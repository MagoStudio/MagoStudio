/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useDummyProject } from "@domains/project/useDummyProject";
import { useProjects } from "@domains/project/useProjects";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { getCircularFolderIds } from "@hooks/projectFolders/utils/getCircularFolderIds";
import { useUser } from "@platform/identity";
import { Project } from "@schemas/project";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";

export const useSyncProjectsToFolders = () => {
  const {
    data: folderDummyProject,
    isLoading: isDummyProjectLoading,
    isError: isDummyProjectError
  } = useDummyProject();
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError
  } = useProjects();
  const { user } = useUser();
  const {
    mutateAsync: updateProject,
    isPending: isUpdating,
    isError: isUpdateProjectError
  } = useUpdateProject();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (
      !folderDummyProject ||
      isProjectsLoading ||
      isProjectsError ||
      !user ||
      isUpdating ||
      isUpdateProjectError ||
      isDummyProjectLoading ||
      isDummyProjectError
    ) {
      return;
    }

    if (hasInitializedRef.current) {
      return;
    }

    const syncFolders = async () => {
      try {
        const folderStructure = folderDummyProject.settings.folders;

        const folderStructureProjects = folderStructure?.filter(
          (folder: FolderOrProject) => folder.type === "project"
        );

        const hasProjectsWithMissingDates = folderStructureProjects?.some(
          (project) => !project.createdAt
        );

        const folderStructureProjectsWithDates = folderStructureProjects?.map(
          (project: FolderOrProject) =>
            !project.createdAt
              ? { ...project, createdAt: dayjs().unix() }
              : project
        );

        const folderStructureProjectIds = folderStructureProjectsWithDates?.map(
          (project: FolderOrProject) => project.id
        );

        const userProjectsIds = projects?.map((project: Project) => project.id);

        const userProjectsToAdd =
          projects?.filter(
            (project: Project) =>
              !folderStructureProjectIds?.includes(project.id)
          ) ?? [];

        const projectsToRemove =
          folderStructureProjects?.filter(
            (folderStructureProject: FolderOrProject) =>
              !userProjectsIds?.includes(folderStructureProject.id) &&
              folderStructureProject.id !== folderDummyProject.id
          ) ?? [];

        const projectsToRemoveDuplicates =
          folderStructureProjects?.filter(
            (project, index, self) =>
              self.findIndex((t) => t.id === project.id) !== index
          ) || [];

        const hasProjectsWithMissingParentId = folderStructureProjects?.some(
          (project) => project.parentFolderId === undefined
        );

        const circularFolderIds = getCircularFolderIds(folderStructure ?? []);

        const shouldUpdateFolderDummyProject =
          (hasProjectsWithMissingDates &&
            (folderStructureProjects?.length ?? 0) > 0) ||
          userProjectsToAdd.length > 0 ||
          (projectsToRemove.length > 0 &&
            !projectsToRemove.some((p) => p.id === folderDummyProject.id)) ||
          projectsToRemoveDuplicates.length > 0 ||
          hasProjectsWithMissingParentId ||
          circularFolderIds.length > 0;

        hasInitializedRef.current = true;

        if (!shouldUpdateFolderDummyProject) {
          return;
        }

        const circularIdSet = new Set(circularFolderIds);
        const folderStructureFolders = folderStructure
          ?.filter((folder: FolderOrProject) => folder.type !== "project")
          .map((folder) =>
            circularIdSet.has(folder.id)
              ? { ...folder, parentFolderId: "" }
              : folder
          );

        const updatedProjects = [
          ...(folderStructureProjectsWithDates ?? []),
          ...userProjectsToAdd.map(
            (project: Project) =>
              ({
                id: project.id,
                name: project.name,
                parentFolderId: "",
                createdAt: dayjs().unix(),
                type: "project"
              }) as FolderOrProject
          )
        ]
          .filter(
            (project, index, self) =>
              self.findIndex((p) => p.id === project.id) === index
          )
          .filter(
            (project) => !projectsToRemove.some((p) => p.id === project.id)
          )
          .map((project) => ({
            ...project,
            parentFolderId: project.parentFolderId ?? ""
          }));

        const updatedFolders = [
          ...(folderStructureFolders ?? []),
          ...updatedProjects
        ];
        const updatedFolderDummyProject = {
          projectId: folderDummyProject.id,
          projectName: folderDummyProject.name,
          projectDescription: folderDummyProject.description,
          settings: {
            ...folderDummyProject.settings,
            folders: updatedFolders
          },
          settingsPatch: { folders: updatedFolders },
          settingsMergeBase: { folders: folderStructure ?? [] }
        };

        await updateProject(updatedFolderDummyProject);
      } catch (error) {
        console.error("Failed to populate folders with user projects:", error);
      }
    };
    void syncFolders();
  }, [
    folderDummyProject,
    isDummyProjectError,
    isUpdateProjectError,
    updateProject,
    isProjectsLoading,
    isProjectsError,
    user,
    isUpdating,
    projects,
    isDummyProjectLoading
  ]);
};
