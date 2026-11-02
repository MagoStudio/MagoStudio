"use client";

import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { useDeleteShotItem } from "@domains/project/useDeleteShotItem";
import { useRenameShotItem } from "@domains/project/useRenameShotItem";
import { DraggableContainer } from "@home/components/dashboard/shared/DraggableContainer";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { useMountEffect } from "@hooks/useMountEffect";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TreeRowDragPreview } from "../shared/TreeRowDragPreview";

import { useHandleShotDragEnd } from "./hooks/useHandleShotDragEnd";
import { useNavigateAfterShotDeletion } from "./hooks/useNavigateAfterShotDeletion";
import { useShotsSelection } from "./hooks/useShotsSelection";
import { ShotTreeItem } from "./ShotTreeItem";
import { collectShotIdsToDelete } from "./utils/collectShotIdsToDelete";
import { pruneDescendantsFromSelection } from "./utils/pruneDescendantsFromSelection";

const INDENT_PX_PER_LEVEL = 24;
const FOLDER_AUTO_EXPAND_ON_HOVER_DELAY_MS = 800;
const DOUBLE_CLICK_THRESHOLD_MS = 250;

interface Props {
  folder: ShotFolderOrShot;
  allItems: ShotFolderOrShot[];
  depth: number;
  projectId: string | undefined;
  expandedFolderIds: Set<string>;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  sortItems: (
    items: ShotFolderOrShot[],
    allItems: ShotFolderOrShot[]
  ) => ShotFolderOrShot[];
  thumbnailUrlById?: Record<string, string | undefined>;
  onClose?: () => void;
  onDropFiles?: (files: File[], targetFolderId?: string) => void;
  activeTimelineId?: string | undefined;
}

export const ShotFolderTreeItem: React.FC<Props> = ({
  folder,
  allItems,
  depth,
  projectId,
  expandedFolderIds,
  toggleFolder,
  expandFolder,
  sortItems,
  thumbnailUrlById,
  onClose,
  onDropFiles,
  activeTimelineId
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { mutateAsync: deleteItem, isPending: isDeleting } =
    useDeleteShotItem(projectId);
  const { handleDragEnd } = useHandleShotDragEnd(projectId);
  const { renameItem } = useRenameShotItem(projectId);
  const { isSelected, toggle, clear, selectedIds } = useShotsSelection();
  const navigateAfterShotDeletion = useNavigateAfterShotDeletion(projectId);
  const hoverExpandTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const selected = isSelected(folder.id);

  const handleRenameFolder = (newName: string) =>
    renameItem(folder.id, newName);

  const expanded = expandedFolderIds.has(folder.id);
  const indentPx = depth * INDENT_PX_PER_LEVEL;

  const sortedChildren = useMemo(() => {
    const children = allItems.filter(
      (item) => item.parentFolderId === folder.id
    );
    return sortItems(children, allItems);
  }, [allItems, folder.id, sortItems]);

  useMountEffect(() => {
    return () => {
      if (hoverExpandTimeoutRef.current) {
        clearTimeout(hoverExpandTimeoutRef.current);
      }
    };
  });

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
  };

  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useMountEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  });

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

  const handleDeleteClick = () => {
    showToast({
      message: t("notifications.confirm_delete_shot_folder.description", {
        name: folder.name
      }),
      onSubmit: async () => {
        const deletedShotIds = collectShotIdsToDelete([folder.id], allItems);
        navigateAfterShotDeletion(deletedShotIds);
        await deleteItem(folder.id);
      },
      onSubmitText: t("actions.delete.label"),
      onCancelText: t("actions.cancel.label"),
      showTimer: false
    });
  };

  const handleDropEnter = useCallback(() => {
    if (expanded) return;
    if (hoverExpandTimeoutRef.current) {
      clearTimeout(hoverExpandTimeoutRef.current);
    }
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

  const handleDropFiles = useCallback(
    ({ files }: { files: File[] }) => onDropFiles?.(files, folder.id),
    [onDropFiles, folder.id]
  );

  const getDraggedIds = () => {
    if (!selected) return [folder.id];
    return pruneDescendantsFromSelection(selectedIds, allItems);
  };

  const renderDragPreview = (draggedIds: string[]) => (
    <TreeRowDragPreview
      draggedIds={draggedIds}
      itemById={new Map(allItems.map((item) => [item.id, item]))}
      thumbnailUrlById={thumbnailUrlById}
    />
  );

  const isValidDropTarget = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, folder.id, allItems);
  };

  return (
    <>
      <DroppableContainer
        id={`shot-folder-droppable-${folder.id}`}
        onDrop={handleDragEnd}
        onDropFiles={handleDropFiles}
        onDropEnter={handleDropEnter}
        onDropExit={handleDropExit}
        isValidDropTarget={isValidDropTarget}
        dropIndicatorStyle="outline"
      >
        <DraggableContainer
          id={`shot-folder-draggable-${folder.id}`}
          getDraggedIds={getDraggedIds}
          renderDragPreview={renderDragPreview}
        >
          <div
            className={cn(
              "group flex flex-row justify-between items-center pr-2 w-full rounded border border-transparent h-10 text-glyph-secondary text-md font-normal select-none cursor-pointer hover:text-glyph-primary hover:bg-element-primary-active",
              selected && "border-glyph-action-main"
            )}
            style={{ paddingLeft: indentPx }}
            data-shots-row="folder"
            data-selected={selected ? "true" : undefined}
          >
            <button
              className="flex flex-row items-center justify-start py-0.5 gap-2 h-full w-full pl-2"
              onClick={handleClick}
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
                onSave={handleRenameFolder}
                maxLength={50}
                inputClassName="text-sm"
                stopPropagation
                onEditingChange={setIsEditing}
                className="min-w-0 flex-1 truncate text-left"
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
            </button>
            {!isEditing && (
              <div
                className="hidden items-center justify-center group-hover:flex"
                onClick={(e) => e.stopPropagation()}
              >
                <IconActionButton
                  aria-label="Delete"
                  icon={<Icon iconSet="16" iconName="delete" />}
                  isDisabled={isDeleting}
                  onPress={handleDeleteClick}
                />
              </div>
            )}
          </div>
        </DraggableContainer>
      </DroppableContainer>

      {expanded &&
        sortedChildren.map((child) =>
          child.type === "folder" ? (
            <ShotFolderTreeItem
              key={child.id}
              folder={child}
              allItems={allItems}
              depth={depth + 1}
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
              key={child.id}
              shot={child}
              depth={depth + 1}
              projectId={projectId}
              thumbnailUrl={thumbnailUrlById?.[child.id]}
              onClose={onClose}
              isActive={child.id === activeTimelineId}
              allItems={allItems}
              thumbnailUrlById={thumbnailUrlById}
              onDropFiles={onDropFiles}
            />
          )
        )}
    </>
  );
};
