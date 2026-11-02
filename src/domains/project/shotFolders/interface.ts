export type ShotFolderOrShot = {
  id: string;
  name: string;
  parentFolderId: string;
  type: "shot" | "folder";
  createdAt: number;
};
