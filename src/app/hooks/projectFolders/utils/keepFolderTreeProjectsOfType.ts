import { FolderOrProject } from "@hooks/projectFolders/interface";
import { ProjectType } from "@schemas/scriptProject";

type ProjectWithType = { id: string; type?: ProjectType };

type FolderTreeFilter = {
  folderTreeItems: FolderOrProject[];
  projects: ProjectWithType[];
  projectType: ProjectType;
};

export const keepFolderTreeProjectsOfType = ({
  folderTreeItems,
  projects,
  projectType
}: FolderTreeFilter): FolderOrProject[] => {
  const projectTypeByProjectId = new Map(
    projects.map((project) => [project.id, project.type ?? "timeline"])
  );

  return folderTreeItems.filter(
    (item) =>
      item.type === "folder" ||
      projectTypeByProjectId.get(item.id) === projectType
  );
};
