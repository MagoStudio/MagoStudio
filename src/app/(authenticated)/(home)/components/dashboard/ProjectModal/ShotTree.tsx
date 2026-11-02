"use client";

import { MenuList } from "@components/MenuList";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { collectAncestorIds } from "@domains/project/shotFolders/utils/collectAncestorIds";
import { useTimelineList } from "@domains/project/useTimelineList";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useHandleShotDragEnd } from "./hooks/useHandleShotDragEnd";
import { useShotsSelection } from "./hooks/useShotsSelection";
import { ShotFolderTreeItem } from "./ShotFolderTreeItem";
import { ShotTreeItem } from "./ShotTreeItem";
import { pruneDescendantsFromSelection } from "./utils/pruneDescendantsFromSelection";

interface Props {
  projectId: string | undefined;
  search: string;
  sortItems: (
    items: ShotFolderOrShot[],
    allItems: ShotFolderOrShot[]
  ) => ShotFolderOrShot[];
  onClose?: () => void;
  onDropFiles?: (files: File[], targetFolderId?: string) => void;
  activeTimelineId?: string | undefined;
}

export const ShotTree: React.FC<Props> = ({
  projectId,
  search,
  sortItems,
  onClose,
  onDropFiles,
  activeTimelineId
}) => {
  const { data } = useProjectShotFolders(projectId);
  const { thumbnailUrlById } = useTimelineList(projectId);
  const { handleDragEnd } = useHandleShotDragEnd(projectId);
  const { clear } = useShotsSelection();
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set()
  );

  const allItems = useMemo(
    () => data?.shotFoldersAndShots || [],
    [data?.shotFoldersAndShots]
  );

  const itemById = useMemo(
    () => new Map(allItems.map((item) => [item.id, item])),
    [allItems]
  );

  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  if (!hasAutoExpanded && activeTimelineId && allItems.length > 0) {
    const activeItem = itemById.get(activeTimelineId);
    if (activeItem) {
      setHasAutoExpanded(true);
      const parentIds = collectAncestorIds(activeItem.parentFolderId, itemById);
      if (parentIds.size > 0) setExpandedFolderIds(parentIds);
    }
  }

  // oxlint-disable -- external sync: drop stale shot selections when the user switches projects
  useEffect(() => {
    clear();
  }, [projectId, clear]);

  const filteredItems = useMemo(() => {
    if (!search) return allItems;
    const query = search.toLowerCase();
    const matchedIds = new Set<string>();

    for (const item of allItems) {
      if (item.name.toLowerCase().includes(query)) {
        matchedIds.add(item.id);
        for (const id of collectAncestorIds(item.parentFolderId, itemById)) {
          matchedIds.add(id);
        }
      }
    }

    return allItems.filter((item) => matchedIds.has(item.id));
  }, [allItems, search, itemById]);

  const sortedRootItems = useMemo(() => {
    const rootItems = filteredItems.filter(
      (item) => !item.parentFolderId || item.parentFolderId === ""
    );
    return sortItems(rootItems, filteredItems);
  }, [filteredItems, sortItems]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  }, []);

  const handleRootDropFiles = useCallback(
    ({ files }: { files: File[] }) => onDropFiles?.(files, ""),
    [onDropFiles]
  );

  const handleRootBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) return;
    const target = e.target as HTMLElement;
    if (!target.closest("[data-shots-row]")) clear();
  };

  const isValidRootDropTarget = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, "", allItems);
  };

  return (
    <DroppableContainer
      id="shot-tree-root-droppable"
      onDrop={handleDragEnd}
      onDropFiles={handleRootDropFiles}
      isValidDropTarget={isValidRootDropTarget}
      dropIndicatorStyle="line"
    >
      <div className="min-h-full" onClick={handleRootBackgroundClick}>
        <MenuList className="w-full gap-0.5 py-2">
          {sortedRootItems.map((item) =>
            item.type === "folder" ? (
              <ShotFolderTreeItem
                key={item.id}
                folder={item}
                allItems={filteredItems}
                depth={0}
                projectId={projectId}
                expandedFolderIds={expandedFolderIds}
                toggleFolder={toggleFolder}
                expandFolder={expandFolder}
                sortItems={sortItems}
                thumbnailUrlById={thumbnailUrlById}
                onClose={onClose}
                onDropFiles={onDropFiles}
                activeTimelineId={activeTimelineId}
              />
            ) : (
              <ShotTreeItem
                key={item.id}
                shot={item}
                depth={0}
                projectId={projectId}
                thumbnailUrl={thumbnailUrlById[item.id]}
                onClose={onClose}
                isActive={item.id === activeTimelineId}
                allItems={filteredItems}
                thumbnailUrlById={thumbnailUrlById}
                onDropFiles={onDropFiles}
              />
            )
          )}
        </MenuList>
      </div>
    </DroppableContainer>
  );
};
