import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useProjectFolders } from "@hooks/projectFolders/useProjectFolders";
import { useUpdateProjectFolders } from "@hooks/projectFolders/useUpdateProjectFolders";
import { trackingUtils } from "@hooks/tracking/trackingUtils";

import { pruneDescendantsFromSelection } from "../../ProjectModal/utils/pruneDescendantsFromSelection";

const ROOT_DROPPABLE_ID = "project-panel-root-droppable";

const stripDraggablePrefix = (raw: string) =>
  raw.replace("project-draggable-", "").replace("folder-draggable-", "");

export const resolveProjectDropTargetFolderId = (
  rawDroppedOnId: string,
  allItems: FolderOrProject[]
): string | null => {
  if (rawDroppedOnId === ROOT_DROPPABLE_ID) return "";

  if (rawDroppedOnId.startsWith("folder-droppable-")) {
    return rawDroppedOnId.replace("folder-droppable-", "");
  }

  if (rawDroppedOnId.startsWith("project-droppable-")) {
    const targetId = rawDroppedOnId.replace("project-droppable-", "");
    const target = allItems.find((item) => item.id === targetId);
    if (!target) return null;
    return target.parentFolderId || "";
  }

  return null;
};

export const buildBulkMoveResult = (
  rawDraggedIds: string[],
  rawDroppedOnId: string,
  allItems: FolderOrProject[]
): { updated: FolderOrProject[]; movedIds: string[] } | null => {
  if (!rawDraggedIds.length || !rawDroppedOnId) return null;

  const draggedIds = rawDraggedIds.map(stripDraggablePrefix);
  const targetFolderId = resolveProjectDropTargetFolderId(
    rawDroppedOnId,
    allItems
  );
  if (targetFolderId === null) return null;

  const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
  if (!isDropAllowed(movedIds, targetFolderId, allItems)) return null;

  const movedSet = new Set(movedIds);
  const updated = allItems.map((item) =>
    movedSet.has(item.id) ? { ...item, parentFolderId: targetFolderId } : item
  );

  return { updated, movedIds };
};

export const useHandleProjectMenuDragEnd = () => {
  const { data } = useProjectFolders();
  const { mutateAsync: updateProjectFolders } = useUpdateProjectFolders();

  const handleDragEnd = async ({
    draggedIds: rawDraggedIds,
    droppedOnId: rawDroppedOnId
  }: {
    draggedIds: string[];
    droppedOnId: string;
  }) => {
    const allItems = data?.projectFoldersAndProjects ?? [];
    const result = buildBulkMoveResult(rawDraggedIds, rawDroppedOnId, allItems);
    if (!result) return;
    await updateProjectFolders(result.updated);

    const targetFolderId = resolveProjectDropTargetFolderId(
      rawDroppedOnId,
      allItems
    );
    if (targetFolderId && targetFolderId !== "") {
      const childrenQuantity = result.updated.filter(
        (item) => item.parentFolderId === targetFolderId
      ).length;
      trackingUtils.projectFoldersActions.update(
        targetFolderId,
        childrenQuantity
      );
    }
  };

  return { handleDragEnd };
};
