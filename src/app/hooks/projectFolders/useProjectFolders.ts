import { useDummyProject } from "@domains/project/useDummyProject";
import { useProjects } from "@domains/project/useProjects";
import { Project } from "@schemas/project";

import { FolderOrProject } from "./interface";

type ProjectFoldersData = {
  projectFoldersAndProjects: FolderOrProject[];
  folderDummyProject: Project | undefined;
};

export const mergeProjectsIntoFolderTree = (
  folders: FolderOrProject[],
  projects: Project[]
): FolderOrProject[] => {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const hydrated = folders.flatMap((item): FolderOrProject[] => {
    if (item.type === "folder") return [item];
    const project = projectById.get(item.id);
    if (!project) return [];
    return [
      {
        ...item,
        name: project.name,
        shared_group_id: project.shared_group_id
      }
    ];
  });
  const indexedProjectIds = new Set(
    hydrated.filter((item) => item.type === "project").map((item) => item.id)
  );
  const unindexedProjects = projects
    .filter((project) => !indexedProjectIds.has(project.id))
    .map((project): FolderOrProject => ({
      id: project.id,
      name: project.name,
      parentFolderId: "",
      createdAt: 0,
      type: "project",
      shared_group_id: project.shared_group_id
    }));

  return [...hydrated, ...unindexedProjects];
};

export const useProjectFolders = () => {
  const {
    data: folderDummyProject,
    isLoading,
    isError,
    error
  } = useDummyProject();
  const { data: projects } = useProjects();

  const projectFoldersAndProjects = mergeProjectsIntoFolderTree(
    folderDummyProject?.settings?.folders || [],
    projects || []
  );
  return {
    data: {
      projectFoldersAndProjects,
      folderDummyProject
    },
    isLoading,
    isError,
    error
  };
};
