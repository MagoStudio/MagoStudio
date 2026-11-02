import dayjs from "dayjs";

import { ShotFolderOrShot } from "./shotFolders/interface";
import { useProjectShotFolders } from "./shotFolders/useProjectShotFolders";
import { useUpdateProjectShotFolders } from "./shotFolders/useUpdateProjectShotFolders";
import { generateUntitledName } from "./utils/generateUntitledName";

export const useCreateShotFolder = (projectId: string | undefined) => {
  const { data } = useProjectShotFolders(projectId);
  const { mutateAsync: updateShotFolders, isPending } =
    useUpdateProjectShotFolders(projectId);

  const createFolder = async (parentFolderId?: string) => {
    const shotFoldersAndShots = data?.shotFoldersAndShots ?? [];

    const folderNames = shotFoldersAndShots
      .filter((item) => item.type === "folder")
      .map((item) => item.name);
    const folderName = generateUntitledName(folderNames, "New Folder");

    const newFolder: ShotFolderOrShot = {
      id: crypto.randomUUID(),
      name: folderName,
      parentFolderId: parentFolderId ?? "",
      type: "folder",
      createdAt: dayjs().unix()
    };

    await updateShotFolders([...shotFoldersAndShots, newFolder]);
    return newFolder;
  };

  return {
    mutateAsync: createFolder,
    isPending
  };
};
