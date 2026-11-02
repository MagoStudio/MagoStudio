"use client";

import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { Text } from "@components/Text";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useDeleteShotItem } from "@domains/project/useDeleteShotItem";
import { useRenameShotItem } from "@domains/project/useRenameShotItem";
import { DraggableContainer } from "@home/components/dashboard/shared/DraggableContainer";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";
import { useMountEffect } from "@hooks/useMountEffect";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TreeRowDragPreview } from "../shared/TreeRowDragPreview";

import { useBulkDeleteShotItems } from "./hooks/useBulkDeleteShotItems";
import { useHandleShotDragEnd } from "./hooks/useHandleShotDragEnd";
import { useNavigateAfterShotDeletion } from "./hooks/useNavigateAfterShotDeletion";
import { useShotsSelection } from "./hooks/useShotsSelection";
import { buildShotSwitchUrl } from "./utils/buildShotSwitchUrl";
import { collectShotIdsToDelete } from "./utils/collectShotIdsToDelete";
import { pruneDescendantsFromSelection } from "./utils/pruneDescendantsFromSelection";

const DOUBLE_CLICK_THRESHOLD_MS = 250;

const INDENT_PX_PER_LEVEL = 24;
const BASE_INDENT_PX = 8;

interface Props {
  shot: ShotFolderOrShot;
  depth: number;
  projectId: string | undefined;
  thumbnailUrl?: string;
  onClose?: () => void;
  isActive?: boolean;
  allItems: ShotFolderOrShot[];
  thumbnailUrlById?: Record<string, string | undefined>;
  onDropFiles?: (files: File[], targetFolderId?: string) => void;
}

export const ShotTreeItem: React.FC<Props> = ({
  shot,
  depth,
  projectId,
  thumbnailUrl,
  onClose,
  isActive,
  allItems,
  thumbnailUrlById,
  onDropFiles
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { mutateAsync: deleteItem, isPending: isDeleting } =
    useDeleteShotItem(projectId);
  const {
    bulkDelete,
    getLeafShotCount,
    willEmptyProject,
    isPending: isBulkDeleting
  } = useBulkDeleteShotItems(projectId);
  const { handleDragEnd } = useHandleShotDragEnd(projectId);
  const { renameItem } = useRenameShotItem(projectId);
  const { isSelected, toggle, clear, selectedIds } = useShotsSelection();
  const { data: shotFoldersData } = useProjectShotFolders(projectId);
  const navigateAfterShotDeletion = useNavigateAfterShotDeletion(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const selected = isSelected(shot.id);

  const handleRenameShot = (newName: string) => renameItem(shot.id, newName);

  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useMountEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  });

  const indentPx = depth * INDENT_PX_PER_LEVEL + BASE_INDENT_PX;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      toggle(shot.id);
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
      onClose?.();
      router.push(
        buildShotSwitchUrl(projectId, shot.id, searchParams.get(TOOL_URL_PARAM))
      );
    }, DOUBLE_CLICK_THRESHOLD_MS);
  };

  const isMultiDelete = selected && selectedIds.size > 1;
  const idsToDelete = isMultiDelete ? Array.from(selectedIds) : [shot.id];

  const handleDeleteClick = () => {
    const willDeleteProject = isMultiDelete && willEmptyProject(idsToDelete);
    const message = isMultiDelete
      ? t(
          willDeleteProject
            ? "notifications.bulk_delete_shots_and_project.description"
            : "notifications.bulk_delete_shots.description",
          { count: getLeafShotCount(idsToDelete) }
        )
      : t("notifications.confirm_delete_shot_folder.description", {
          name: shot.name
        });
    showToast({
      message,
      onSubmit: async () => {
        const allItems = shotFoldersData?.shotFoldersAndShots ?? [];
        const deletedShotIds = collectShotIdsToDelete(idsToDelete, allItems);

        navigateAfterShotDeletion(deletedShotIds);

        if (isMultiDelete) {
          await bulkDelete(idsToDelete);
          clear();
        } else {
          await deleteItem(shot.id);
        }
      },
      onSubmitText: t("actions.delete.label"),
      onCancelText: t("actions.cancel.label"),
      showTimer: false
    });
  };

  const getDraggedIds = () => {
    if (!selected) return [shot.id];
    return pruneDescendantsFromSelection(selectedIds, allItems);
  };

  const renderDragPreview = (draggedIds: string[]) => (
    <TreeRowDragPreview
      draggedIds={draggedIds}
      itemById={new Map(allItems.map((item) => [item.id, item]))}
      thumbnailUrlById={thumbnailUrlById}
    />
  );

  const targetFolderIdForDrop = shot.parentFolderId || "";
  const isValidDropTargetForShotRow = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, targetFolderIdForDrop, allItems);
  };

  const handleDropFiles = ({ files }: { files: File[] }) =>
    onDropFiles?.(files, targetFolderIdForDrop);

  return (
    <DroppableContainer
      id={`shot-droppable-${shot.id}`}
      onDrop={handleDragEnd}
      onDropFiles={handleDropFiles}
      isValidDropTarget={isValidDropTargetForShotRow}
      dropIndicatorStyle="line"
    >
      <DraggableContainer
        id={`shot-draggable-${shot.id}`}
        getDraggedIds={getDraggedIds}
        renderDragPreview={renderDragPreview}
      >
        <div
          className={cn(
            "group flex flex-row justify-between items-center pr-2 w-full rounded border border-transparent text-glyph-secondary text-md font-normal select-none cursor-pointer hover:text-glyph-primary hover:bg-element-primary-active",
            isActive && "bg-element-primary-active",
            selected && "border-glyph-action-main"
          )}
          style={{ paddingLeft: indentPx }}
          data-shots-row="shot"
          data-selected={selected ? "true" : undefined}
        >
          <div
            role="button"
            tabIndex={0}
            className="flex flex-row items-center justify-start py-1.5 gap-4 min-w-0 flex-1"
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(e as unknown as React.MouseEvent);
              }
            }}
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt=""
                className="h-8 w-[57px] rounded object-cover shrink-0"
              />
            )}
            <InlineEditableText
              value={shot.name}
              onSave={handleRenameShot}
              maxLength={50}
              inputClassName="text-sm"
              stopPropagation
              onEditingChange={setIsEditing}
              className="min-w-0 flex-1 truncate text-left"
            >
              <Text color="inherit" component="span" variant="sm">
                {shot.name}
              </Text>
            </InlineEditableText>
          </div>
          <div className="flex items-center justify-center gap-1 shrink-0">
            {isActive && !isEditing && (
              <Icon iconSet="16" iconName="checkmark" />
            )}
            {!isEditing && (
              <div
                className="hidden group-hover:flex"
                onClick={(e) => e.stopPropagation()}
              >
                <IconActionButton
                  aria-label="Delete"
                  icon={<Icon iconSet="16" iconName="delete" />}
                  isDisabled={isDeleting || isBulkDeleting}
                  onPress={handleDeleteClick}
                />
              </div>
            )}
          </div>
        </div>
      </DraggableContainer>
    </DroppableContainer>
  );
};
