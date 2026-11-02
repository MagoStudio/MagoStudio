import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { fetchProject } from "@domains/project/fetchProject";
import { useDeleteProject } from "@domains/project/useDeleteProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { deferCloudProjectCatalogSync } from "@domains/scriptProject/syncCloudScriptProjects";
import { resolveProjectHref } from "@domains/scriptProject/utils/resolveProjectHref";
import { DraggableContainer } from "@home/components/dashboard/shared/DraggableContainer";
import { DroppableContainer } from "@home/components/dashboard/shared/DroppableContainer";
import { isDropAllowed } from "@home/components/dashboard/shared/isDropAllowed";
import { FolderOrProject } from "@hooks/projectFolders/interface";
import { useMountEffect } from "@hooks/useMountEffect";
import { Project } from "@schemas/project";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { pruneDescendantsFromSelection } from "../ProjectModal/utils/pruneDescendantsFromSelection";
import { ProjectPreviewImage } from "../ProjectPreviewImage";
import { TreeRowDragPreview } from "../shared/TreeRowDragPreview";

import { useProjectsSelection } from "./hooks/useProjectsSelection";

const DOUBLE_CLICK_THRESHOLD_MS = 250;
const INDENT_PX_PER_LEVEL = 8;
const BASE_INDENT_PX = 8;

interface Props {
  project: FolderOrProject;
  allItems: FolderOrProject[];
  allProjects: Pick<Project, "id" | "type">[] | undefined;
  previewUrlById: Record<string, string | undefined>;
  depth: number;
  previewUrl?: string;
  onDragEnd: (args: { draggedIds: string[]; droppedOnId: string }) => void;
  onClose: () => void;
}

export const AllProjectsProjectItem: React.FC<Props> = ({
  project,
  allItems,
  allProjects,
  previewUrlById,
  depth,
  previewUrl,
  onDragEnd,
  onClose
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { mutate: deleteProject } = useDeleteProject();
  const { mutateAsync: updateProject } = useUpdateProject();
  const selectedProjectId = useSelectedProjectId();
  const { isSelected, toggle, clear, selectedIds } = useProjectsSelection();
  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const isActive = selectedProjectId === project.id;
  const selected = isSelected(project.id);
  const indentPx = depth * INDENT_PX_PER_LEVEL + BASE_INDENT_PX;

  const [isEditing, setIsEditing] = useState(false);

  const handleRenameProject = async (newName: string) => {
    const fullProject = await fetchProject(project.id);
    if (!fullProject) return;
    await updateProject({
      projectId: project.id,
      projectName: newName,
      projectDescription: fullProject.description,
      settings: fullProject.settings,
      settingsPatch: {}
    });
  };

  useMountEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  });

  const navigateToProject = () => {
    deferCloudProjectCatalogSync();
    onClose();
    router.push(resolveProjectHref(allProjects, project.id));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      toggle(project.id);
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
      navigateToProject();
    }, DOUBLE_CLICK_THRESHOLD_MS);
  };

  const handleRowDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = undefined;
    }
  };

  const handleDeleteClick = () => {
    showToast({
      message: t("notifications.confirm_delete_project.description", {
        name: project.name
      }),
      onSubmit: () => {
        const isDeletingActiveProject = selectedProjectId === project.id;
        deleteProject({ projectId: project.id });
        if (isDeletingActiveProject) {
          onClose();
          router.push("/");
        }
      },
      onSubmitText: t("actions.delete.label"),
      onCancelText: t("actions.cancel.label"),
      showTimer: false
    });
  };

  const getDraggedIds = () => {
    if (!selected) return [project.id];
    return pruneDescendantsFromSelection(selectedIds, allItems);
  };

  const renderDragPreview = (draggedIds: string[]) => (
    <TreeRowDragPreview
      draggedIds={draggedIds}
      itemById={new Map(allItems.map((item) => [item.id, item]))}
      thumbnailUrlById={previewUrlById}
    />
  );

  const targetFolderIdForDrop = project.parentFolderId || "";
  const isValidDropTargetForRow = (draggedIds: string[]) => {
    const movedIds = pruneDescendantsFromSelection(draggedIds, allItems);
    return isDropAllowed(movedIds, targetFolderIdForDrop, allItems);
  };

  return (
    <DroppableContainer
      id={`project-droppable-${project.id}`}
      onDrop={onDragEnd}
      isValidDropTarget={isValidDropTargetForRow}
      dropIndicatorStyle="line"
    >
      <DraggableContainer
        id={`project-draggable-${project.id}`}
        getDraggedIds={getDraggedIds}
        renderDragPreview={renderDragPreview}
      >
        <div
          className={cn(
            "group flex items-center gap-4 pr-2 py-[6px] rounded border border-transparent cursor-pointer hover:bg-element-primary-active",
            isActive && "bg-element-primary-active",
            selected && "border-glyph-action-main"
          )}
          style={{ paddingLeft: indentPx }}
          onClick={handleClick}
          onDoubleClick={handleRowDoubleClick}
          data-testid={`project-row-${project.id}`}
          data-projects-row="project"
          data-selected={selected ? "true" : undefined}
        >
          <div className="shrink-0 w-[57px] h-[32px] rounded overflow-hidden">
            {previewUrl ? (
              <ProjectPreviewImage src={previewUrl} alt={project.name} />
            ) : (
              <Skeleton
                variant="rounded"
                width={57}
                height={32}
                className="shrink-0 rounded!"
              />
            )}
          </div>

          <InlineEditableText
            value={project.name}
            onSave={handleRenameProject}
            trigger="doubleClick"
            inputClassName="text-sm"
            stopPropagation
            onEditingChange={setIsEditing}
            className="flex-1 min-w-0"
          >
            <Text
              component="p"
              variant="sm"
              color="glyph-primary"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {project.name}
            </Text>
          </InlineEditableText>

          {isActive && !isEditing && (
            <div className="flex items-center justify-center group-hover:hidden shrink-0">
              <Icon iconSet="16" iconName="checkmark" />
            </div>
          )}
          <div className="hidden items-center justify-center shrink-0 group-hover:flex">
            <div onClick={(e) => e.stopPropagation()}>
              <IconActionButton
                aria-label={t("actions.delete_project.ariaLabel")}
                icon={<Icon iconSet="16" iconName="delete" />}
                onPress={handleDeleteClick}
                data-testid={`project-row-delete-${project.id}`}
              />
            </div>
          </div>
        </div>
      </DraggableContainer>
    </DroppableContainer>
  );
};
