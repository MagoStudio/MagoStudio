import { FolderOrProject } from "../interface";

export const getAllDescendantProjectsOrFolders = (
  parentId: string,
  projectFoldersAndProjects: FolderOrProject[]
): Array<FolderOrProject> => {
  const descendants: Array<FolderOrProject> = [];

  if (!parentId) return projectFoldersAndProjects;

  const visited = new Set<string>();

  const findChildren = (currentParentId: string) => {
    const children = projectFoldersAndProjects.filter(
      (item) => item.parentFolderId === currentParentId
    );

    children.forEach((child) => {
      if (visited.has(child.id)) return;
      visited.add(child.id);
      descendants.push(child);
      findChildren(child.id);
    });
  };

  findChildren(parentId);
  return descendants;
};
