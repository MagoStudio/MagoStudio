import { Checkbox } from "@components/Checkbox";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { collectLeafShotIds } from "@domains/project/utils/collectLeafShotIds";

import { PlanShotTreeItem } from "./PlanShotTreeItem";

const INDENT_PX_PER_LEVEL = 24;

interface Props {
  folder: ShotFolderOrShot;
  allItems: ShotFolderOrShot[];
  allItemsForSelection: ShotFolderOrShot[];
  depth: number;
  expandedFolderIds: Set<string>;
  toggleFolder: (id: string) => void;
  sortItems: (
    items: ShotFolderOrShot[],
    allItems: ShotFolderOrShot[]
  ) => ShotFolderOrShot[];
  thumbnailUrlById: Record<string, string | undefined>;
  selectedIds: Set<string>;
  onToggleShot: (id: string) => void;
  onSetMany: (ids: string[], selected: boolean) => void;
}

export const PlanShotFolderTreeItem: React.FC<Props> = ({
  folder,
  allItems,
  allItemsForSelection,
  depth,
  expandedFolderIds,
  toggleFolder,
  sortItems,
  thumbnailUrlById,
  selectedIds,
  onToggleShot,
  onSetMany
}) => {
  const expanded = expandedFolderIds.has(folder.id);
  const indentPx = depth * INDENT_PX_PER_LEVEL;

  const sortedChildren = sortItems(
    allItems.filter((item) => item.parentFolderId === folder.id),
    allItems
  );

  const leafShotIds = collectLeafShotIds([folder.id], allItemsForSelection);
  const allLeavesSelected =
    leafShotIds.size > 0 &&
    Array.from(leafShotIds).every((id) => selectedIds.has(id));

  const handleToggleFolderSelection = () => {
    onSetMany(Array.from(leafShotIds), !allLeavesSelected);
  };

  return (
    <>
      <div
        className="group flex flex-row items-center gap-2 pr-2 w-full rounded border border-transparent h-10 text-glyph-secondary select-none hover:text-glyph-primary hover:bg-element-primary-active"
        style={{ paddingLeft: indentPx }}
        data-shots-row="folder"
      >
        <div className="pl-2">
          <Checkbox
            isChecked={allLeavesSelected}
            disabled={leafShotIds.size === 0}
            onChange={handleToggleFolderSelection}
          />
        </div>
        <button
          type="button"
          className="flex flex-row items-center justify-start py-0.5 gap-2 h-full w-full min-w-0 cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <span
            aria-label={expanded ? "Collapse folder" : "Expand folder"}
            className="flex items-center justify-center shrink-0"
          >
            <Icon
              iconSet="16"
              iconName={expanded ? "chevron-down" : "chevron-right"}
            />
          </span>
          <Text
            className="min-w-0 flex-1 truncate text-left"
            color="inherit"
            component="span"
            variant="sm"
          >
            {folder.name}
          </Text>
        </button>
      </div>

      {expanded &&
        sortedChildren.map((child) =>
          child.type === "folder" ? (
            <PlanShotFolderTreeItem
              key={child.id}
              folder={child}
              allItems={allItems}
              allItemsForSelection={allItemsForSelection}
              depth={depth + 1}
              expandedFolderIds={expandedFolderIds}
              toggleFolder={toggleFolder}
              sortItems={sortItems}
              thumbnailUrlById={thumbnailUrlById}
              selectedIds={selectedIds}
              onToggleShot={onToggleShot}
              onSetMany={onSetMany}
            />
          ) : (
            <PlanShotTreeItem
              key={child.id}
              shot={child}
              depth={depth + 1}
              thumbnailUrl={thumbnailUrlById[child.id]}
              selected={selectedIds.has(child.id)}
              onToggle={onToggleShot}
            />
          )
        )}
    </>
  );
};
