import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { DraggableContainer } from "@home/components/dashboard/shared/DraggableContainer";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { useCreateProjectFoldersFolder } from "@home/components/dashboard/shared/hooks/useCreateProjectFoldersFolder";
import { useDeleteProjectFolder } from "@home/components/dashboard/shared/hooks/useDeleteProjectFolder";
import { useRenameProjectFolder } from "@home/components/dashboard/shared/hooks/useRenameProjectFolder";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useExpandedFolders } from "@hooks/projectFolders/useExpandedFolders";
import { useMountEffect } from "@hooks/useMountEffect";
import { Project } from "@schemas/project";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { pruneDescendantsFromSelection } from "../ProjectModal/utils/pruneDescendantsFromSelection";
import { TreeRowDragPreview } from "../shared/TreeRowDragPreview";

import { AllProjectsProjectItem } from "./AllProjectsProjectItem";
import { useProjectsSelection } from "./hooks/useProjectsSelection";

const INDENT_PX_PER_LEVEL = 8;
const FOLDER_AUTO_EXPAND_ON_HOVER_DELAY_MS = 800;
const DOUBLE_CLICK_THRESHOLD_MS = 250;

interface Props {
  folder: FolderOrProject;
  allItems: FolderOrProject[];
  allProjects: Pick<Project, "id" | "type">[] | undefined;
  depth: number;
  sortItems: (
    items: FolderOrProject[],
    allItems: FolderOrProject[]
  ) => FolderOrProject[];
  previewUrlById: Record<string, string | undefined>;
  onDragEnd: (args: { draggedIds: string[]; droppedOnId: string }) => void;
  onClose: () => void;
}

export const AllProjectsFolderItem: React.FC<Props> = ({
  folder,
  allItems,
  allProjects,
  depth,
  sortItems,
  previewUrlById,
  onDragEnd,
  onClose
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } =
    useDeleteProjectFolder();
  const { mutateAsync: createFolder, isPending: isCreatingFolder } =
    useCreateProjectFoldersFolder();
  const { isExpanded, toggleFolder, expandFolder } = useExpandedFolders();
  const { mutateAsync: renameFolder } = useRenameProjectFolder();
  const { isSelected, toggle, clear, selectedIds } = useProjectsSelection();
  const hoverExpandTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const selected = isSelected(folder.id);

  const handleRenameFolderSave = (newName: string) =>
    renameFolder({ folderId: folder.id, newName });

  const expanded = isExpanded(folder.id);
  const indentPx = depth * INDENT_PX_PER_LEVEL;

  const sortedChildren = useMemo(
    () =>
      sortItems(
        allItems.filter((item) => item.parentFolderId === folder.id),
        allItems
      ),
    [allItems, folder.id, sortItems]
  );

  useMountEffect(() => {
    return () => {
      if (hoverExpandTimeoutRef.current)
        clearTimeout(hoverExpandTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  });

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      toggle(folder.id);
      return;
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = undefined;
      return;
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = undefined;
      clear();
      toggleFolder(folder.id);
    }, DOUBLE_CLICK_THRESHOLD_MS);
  };

  const handleRowDoubleClick = () => {
    if (isEditing) return;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = undefined;
    }
    toggleFolder(folder.id);
  };

  const handleDeleteClick = () => {
    showToast({
      message: t("notifications.confirm_delete_folder.description", {
        name: folder.name
      }),
      onSubmit: () => deleteFolder(folder.id),
      onSubmitText: t("actions.delete.label"),
      onCancelText: t("actions.cancel.label"),
      showTimer: false
    });
  };

  const handleCreateSubfolder = async () => {
    await createFolder(folder.id);
    expandFolder(folder.id);
  };

  const handleDropEnter = useCallback(() => {
    if (expanded) return;
    if (hoverExpandTimeoutRef.current)
      clearTimeout(hoverExpandTimeoutRef.current);
    hoverExpandTimeoutRef.current = setTimeout(() => {
      expandFolder(folder.id);
      hoverExpandTimeoutRef.current = undefined;
    }, FOLDER_AUTO_EXPAND_ON_HOVER_DELAY_MS);
  }, [expandFolder, expanded, folder.id]);

  const handleDropExit = useCallback(() => {
    if (!hoverExpandTimeoutRef.current) return;
    clearTimeout(hoverExpandTimeoutRef.current);
    hoverExpandTimeoutRef.current = undefined;
  }, []);

  const getDraggedIds = () => {
    if (!selected) return [folder.id];
    return pruneDescendantsFromSelection(selectedIds, allItems);
  };

  const renderDragPreview = (draggedIds: string[]) => (
    <TreeRowDragPreview
      draggedIds={draggedIds}
      itemById={new Map(allItems.map((item) => [item.id, item]))}
      thumbnailUrlById={previewUrlById}
    />
  );

  const isValidDropTargetForFolder = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, folder.id, allItems);
  };

  return (
    <>
      <DroppableContainer
        id={`folder-droppable-${folder.id}`}
        onDrop={onDragEnd}
        onDropEnter={handleDropEnter}
        onDropExit={handleDropExit}
        isValidDropTarget={isValidDropTargetForFolder}
        dropIndicatorStyle="outline"
      >
        <DraggableContainer
          id={`folder-draggable-${folder.id}`}
          getDraggedIds={getDraggedIds}
          renderDragPreview={renderDragPreview}
        >
          <div
            className={cn(
              "group flex flex-row justify-between items-center pr-2 h-10 w-full rounded border border-transparent text-glyph-secondary text-md font-normal select-none cursor-pointer hover:text-glyph-primary hover:bg-element-primary-active my-0.5",
              selected && "border-glyph-action-main"
            )}
            style={{ paddingLeft: indentPx }}
            data-projects-row="folder"
            data-selected={selected ? "true" : undefined}
          >
            <div
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-start py-0.5 gap-2 h-full w-full pl-2"
              onClick={handleClick}
              onDoubleClick={handleRowDoubleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              <span
                role="button"
                aria-label={expanded ? "Collapse folder" : "Expand folder"}
                onClick={handleChevronClick}
                className="flex items-center justify-center shrink-0"
              >
                <Icon
                  iconSet="16"
                  iconName={expanded ? "chevron-down" : "chevron-right"}
                />
              </span>
              <InlineEditableText
                value={folder.name}
                onSave={handleRenameFolderSave}
                maxLength={50}
                inputClassName="text-sm"
                stopPropagation
                onEditingChange={setIsEditing}
                className="max-w-[24ch]"
              >
                <Text
                  className="overflow-hidden max-w-[24ch]"
                  color="inherit"
                  component="span"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  variant="sm"
                >
                  {folder.name}
                </Text>
              </InlineEditableText>
            </div>
            <div
              className="hidden items-center justify-center gap-1 group-hover:flex"
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip
                placement="top"
                textContent={t("actions.new_folder.label")}
              >
                <IconActionButton
                  aria-label={t("actions.new_folder.label")}
                  icon={<Icon iconSet="16" iconName="create-new-folder" />}
                  isDisabled={isCreatingFolder}
                  onPress={handleCreateSubfolder}
                />
              </Tooltip>
              <IconActionButton
                aria-label={t("actions.delete.label")}
                icon={<Icon iconSet="16" iconName="delete" />}
                isDisabled={isDeletingFolder}
                onPress={handleDeleteClick}
              />
            </div>
          </div>
        </DraggableContainer>
      </DroppableContainer>

      {expanded &&
        sortedChildren.map((child) =>
          child.type === "folder" ? (
            <AllProjectsFolderItem
              key={child.id}
              folder={child}
              allItems={allItems}
              allProjects={allProjects}
              depth={depth + 1}
              sortItems={sortItems}
              previewUrlById={previewUrlById}
              onDragEnd={onDragEnd}
              onClose={onClose}
            />
          ) : (
            <AllProjectsProjectItem
              key={child.id}
              project={child}
              allItems={allItems}
              allProjects={allProjects}
              previewUrlById={previewUrlById}
              depth={depth + 1}
              previewUrl={previewUrlById[child.id]}
              onDragEnd={onDragEnd}
              onClose={onClose}
            />
          )
        )}
    </>
  );
};
