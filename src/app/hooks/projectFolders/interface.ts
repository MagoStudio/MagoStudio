export type FolderOrProject = {
  id: string;
  name: string;
  parentFolderId: string | null;
  type: "project" | "folder";
  createdAt: number;
  shared_group_id?: string | null;
};
