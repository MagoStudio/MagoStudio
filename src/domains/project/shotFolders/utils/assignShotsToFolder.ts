import { ShotFolderOrShot } from "../interface";

export const assignShotsToFolder = ({
  items,
  shots,
  targetFolderId
}: {
  items: ShotFolderOrShot[];
  shots: Array<{ id: string; name: string }>;
  targetFolderId: string;
}): ShotFolderOrShot[] => {
  const shotNameById = new Map(shots.map((shot) => [shot.id, shot.name]));
  const placed = items.map((item) =>
    shotNameById.has(item.id)
      ? { ...item, parentFolderId: targetFolderId }
      : item
  );
  const knownIds = new Set(items.map((item) => item.id));
  const createdAt = Math.floor(Date.now() / 1000);
  const missing = shots
    .filter((shot) => !knownIds.has(shot.id))
    .map<ShotFolderOrShot>((shot) => ({
      id: shot.id,
      name: shot.name,
      parentFolderId: targetFolderId,
      type: "shot",
      createdAt
    }));

  return [...placed, ...missing];
};
