import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useUpdateProjectShotFolders } from "@domains/project/shotFolders/useUpdateProjectShotFolders";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";

import { pruneDescendantsFromSelection } from "../utils/pruneDescendantsFromSelection";

const ROOT_DROPPABLE_ID = "shot-tree-root-droppable";

const stripDraggablePrefix = (raw: string) =>
  raw.replace("shot-folder-draggable-", "").replace("shot-draggable-", "");

export const resolveDropTargetFolderId = (
  rawDroppedOnId: string,
  allItems: ShotFolderOrShot[]
): string | null => {
  if (rawDroppedOnId === ROOT_DROPPABLE_ID) return "";

  if (rawDroppedOnId.startsWith("shot-folder-droppable-")) {
    return rawDroppedOnId.replace("shot-folder-droppable-", "");
  }

  if (rawDroppedOnId.startsWith("shot-droppable-")) {
    const targetShotId = rawDroppedOnId.replace("shot-droppable-", "");
    const targetShot = allItems.find((item) => item.id === targetShotId);
    if (!targetShot) return null;
    return targetShot.parentFolderId || "";
  }

  return null;
};

export const useHandleShotDragEnd = (projectId: string | undefined) => {
  const { data } = useProjectShotFolders(projectId);
  const { mutateAsync: updateShotFolders } =
    useUpdateProjectShotFolders(projectId);

  const handleDragEnd = async ({
    draggedIds: rawDraggedIds,
    droppedOnId: rawDroppedOnId
  }: {
    draggedIds: string[];
    droppedOnId: string;
  }) => {
    if (!rawDraggedIds.length || !rawDroppedOnId) return;

    const allItems = data?.shotFoldersAndShots ?? [];

    const draggedIds = rawDraggedIds.map(stripDraggablePrefix);
    const targetFolderId = resolveDropTargetFolderId(rawDroppedOnId, allItems);
    if (targetFolderId === null) return;

    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    if (!isDropAllowed(movedIds, targetFolderId, allItems)) return;

    const movedSet = new Set(movedIds);
    const updated = allItems.map((item) =>
      movedSet.has(item.id) ? { ...item, parentFolderId: targetFolderId } : item
    );
    await updateShotFolders(updated);
  };

  return { handleDragEnd };
};
