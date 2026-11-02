import { MenuList } from "@components/MenuList";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { useHandleProjectMenuDragEnd } from "@home/components/dashboard/shared/hooks/useHandleProjectMenuDragEnd";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useExpandedFolders } from "@hooks/projectFolders/useExpandedFolders";
import { useMountEffect } from "@hooks/useMountEffect";
import { Project } from "@schemas/project";
/* oxlint-disable custom-react/no-use-effect -- external sync: expand ancestor folders into jotai atom when search reveals nested items */
import { useEffect, useMemo } from "react";

import { pruneDescendantsFromSelection } from "../ProjectModal/utils/pruneDescendantsFromSelection";

import { AllProjectsFolderItem } from "./AllProjectsFolderItem";
import { AllProjectsProjectItem } from "./AllProjectsProjectItem";
import { useProjectsSelection } from "./hooks/useProjectsSelection";

interface Props {
  allItems: FolderOrProject[];
  allProjects: Pick<Project, "id" | "type">[] | undefined;
  search: string;
  sortItems: (
    items: FolderOrProject[],
    allItems: FolderOrProject[]
  ) => FolderOrProject[];
  previewUrlById: Record<string, string | undefined>;
  onClose: () => void;
}

export const AllProjectsTree: React.FC<Props> = ({
  allItems,
  allProjects,
  search,
  sortItems,
  previewUrlById,
  onClose
}) => {
  const { handleDragEnd } = useHandleProjectMenuDragEnd();
  const { expandFolders } = useExpandedFolders();
  const { clear } = useProjectsSelection();

  useMountEffect(() => {
    clear();
  });

  const filteredItems = useMemo(() => {
    if (!search) return allItems;
    const query = search.toLowerCase();
    const matchedIds = new Set<string>();
    const itemById = new Map(allItems.map((i) => [i.id, i]));

    for (const item of allItems) {
      if (item.name.toLowerCase().includes(query)) {
        matchedIds.add(item.id);
        let parentId = item.parentFolderId;
        while (parentId) {
          matchedIds.add(parentId);
          parentId = itemById.get(parentId)?.parentFolderId ?? null;
        }
      }
    }

    return allItems.filter((item) => matchedIds.has(item.id));
  }, [allItems, search]);

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- external-store sync of expanded folders on search */
  useEffect(() => {
    if (!search) return;
    const folderIds = filteredItems
      .filter((item) => item.type === "folder")
      .map((item) => item.id);
    expandFolders(folderIds);
  }, [filteredItems, expandFolders, search]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  const sortedRootItems = useMemo(() => {
    const rootItems = filteredItems.filter(
      (item) => !item.parentFolderId || item.parentFolderId === ""
    );
    return sortItems(rootItems, allItems);
  }, [filteredItems, sortItems, allItems]);

  const handleRootBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) return;
    const target = e.target as HTMLElement;
    if (!target.closest("[data-projects-row]")) clear();
  };

  const isValidRootDropTarget = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, "", allItems);
  };

  return (
    <DroppableContainer
      id="project-panel-root-droppable"
      onDrop={handleDragEnd}
      isValidDropTarget={isValidRootDropTarget}
      dropIndicatorStyle="line"
    >
      <div className="min-h-full" onClick={handleRootBackgroundClick}>
        <MenuList className="w-full gap-0">
          {sortedRootItems.map((item) =>
            item.type === "folder" ? (
              <AllProjectsFolderItem
                key={item.id}
                folder={item}
                allItems={filteredItems}
                allProjects={allProjects}
                depth={0}
                sortItems={sortItems}
                previewUrlById={previewUrlById}
                onDragEnd={handleDragEnd}
                onClose={onClose}
              />
            ) : (
              <AllProjectsProjectItem
                key={item.id}
                project={item}
                allItems={filteredItems}
                allProjects={allProjects}
                previewUrlById={previewUrlById}
                depth={0}
                previewUrl={previewUrlById[item.id]}
                onDragEnd={handleDragEnd}
                onClose={onClose}
              />
            )
          )}
        </MenuList>
      </div>
    </DroppableContainer>
  );
};
