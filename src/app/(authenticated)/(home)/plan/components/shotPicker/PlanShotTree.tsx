import { MenuList } from "@components/MenuList";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { collectAncestorIds } from "@domains/project/shotFolders/utils/collectAncestorIds";
import { useTimelineList } from "@domains/project/useTimelineList";
import { useState } from "react";

import { PlanShotFolderTreeItem } from "./PlanShotFolderTreeItem";
import { PlanShotTreeItem } from "./PlanShotTreeItem";

interface Props {
  projectId: string | undefined;
  search: string;
  sortItems: (
    items: ShotFolderOrShot[],
    allItems: ShotFolderOrShot[]
  ) => ShotFolderOrShot[];
  selectedIds: Set<string>;
  onToggleShot: (id: string) => void;
  onSetMany: (ids: string[], selected: boolean) => void;
}

export const PlanShotTree: React.FC<Props> = ({
  projectId,
  search,
  sortItems,
  selectedIds,
  onToggleShot,
  onSetMany
}) => {
  const { data } = useProjectShotFolders(projectId);
  const { thumbnailUrlById } = useTimelineList(projectId);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set()
  );

  const allItems = data?.shotFoldersAndShots || [];

  const itemById = new Map(allItems.map((item) => [item.id, item]));

  const filteredItems = (() => {
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
  })();

  const sortedRootItems = sortItems(
    filteredItems.filter(
      (item) => !item.parentFolderId || item.parentFolderId === ""
    ),
    filteredItems
  );

  const searchExpandedFolderIds = new Set(
    filteredItems
      .filter((item) => item.type === "folder")
      .map((item) => item.id)
  );
  const activeExpandedFolderIds = search
    ? searchExpandedFolderIds
    : expandedFolderIds;

  const toggleFolder = (folderId: string) => {
    if (search) return;
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <MenuList className="w-full gap-0.5 py-2">
      {sortedRootItems.map((item) =>
        item.type === "folder" ? (
          <PlanShotFolderTreeItem
            key={item.id}
            folder={item}
            allItems={filteredItems}
            allItemsForSelection={allItems}
            depth={0}
            expandedFolderIds={activeExpandedFolderIds}
            toggleFolder={toggleFolder}
            sortItems={sortItems}
            thumbnailUrlById={thumbnailUrlById}
            selectedIds={selectedIds}
            onToggleShot={onToggleShot}
            onSetMany={onSetMany}
          />
        ) : (
          <PlanShotTreeItem
            key={item.id}
            shot={item}
            depth={0}
            thumbnailUrl={thumbnailUrlById[item.id]}
            selected={selectedIds.has(item.id)}
            onToggle={onToggleShot}
          />
        )
      )}
    </MenuList>
  );
};
