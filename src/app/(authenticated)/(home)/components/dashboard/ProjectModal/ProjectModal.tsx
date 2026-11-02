"use client";

import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useProject } from "@domains/project/useProject";
import { useProjects } from "@domains/project/useProjects";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { generateUntitledName } from "@domains/project/utils/generateUntitledName";
import { useProjectShotsToolbar } from "@home/components/dashboard/hooks/useProjectShotsToolbar";
import { ModalWithToolbar } from "@home/components/dashboard/ModalWithToolbar";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BulkDeleteToolbarButton } from "./BulkDeleteToolbarButton";
import { BulkUploadPanel } from "./BulkUploadPanel";
import { ProjectModalEmptyState } from "./ProjectModalEmptyState";
import { ShotTree } from "./ShotTree";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId?: string | undefined;
  activeTimelineId?: string | undefined;
}

export const ProjectModal: React.FC<Props> = ({
  open,
  onClose,
  projectId,
  activeTimelineId
}) => {
  const { t } = useTranslation();
  const { data: project } = useProject(projectId);
  const { data: allProjects } = useProjects();
  const { mutateAsync: updateProject } = useUpdateProject();

  const {
    search,
    setSearch,
    sortOptions,
    selectedSortKey,
    handleSortChange,
    sortDirection,
    toggleSortDirection,
    sortItems,
    hasContent,
    createFolder,
    handleUploadVideos,
    handleDropFiles,
    bulkUploadState,
    cancelAllUploads,
    hideBulkUploadPanel
  } = useProjectShotsToolbar(projectId);

  const isNewProject = !projectId;

  const untitledName = isNewProject
    ? generateUntitledName(
        allProjects?.map((p) => p.name) ?? [],
        t("titles.untitled_project.label")
      )
    : "";

  const title = isNewProject
    ? untitledName
    : (project?.name ?? t("titles.project_modal.label"));

  const handleClose = useCallback(() => {
    if (bulkUploadState.isUploadInProgress) {
      const confirmed = window.confirm(
        t("notifications.upload_cancel_confirm.description")
      );
      if (!confirmed) return;
      cancelAllUploads();
    }
    hideBulkUploadPanel();
    onClose();
  }, [
    bulkUploadState.isUploadInProgress,
    cancelAllUploads,
    hideBulkUploadPanel,
    onClose,
    t
  ]);

  const handleRenameProject = useCallback(
    async (newName: string) => {
      if (!projectId || !project) return;
      await updateProject({
        projectId,
        projectName: newName,
        projectDescription: project.description,
        settings: project.settings,
        settingsPatch: {}
      });
    },
    [projectId, project, updateProject]
  );

  const primaryAction = (
    <GhostButton
      className="h-8 px-2.5 bg-element-primary text-glyph-secondary"
      onPress={handleUploadVideos}
    >
      {t("actions.add_video.label")}
    </GhostButton>
  );

  const secondaryActions = (
    <>
      {hasContent && (
        <IconActionButton
          icon={<Icon iconSet="16" iconName="create-new-folder" />}
          size="sm"
          variant="dark"
          onPress={() => createFolder()}
          aria-label={t("actions.create_folder.label")}
        />
      )}
      <BulkDeleteToolbarButton projectId={projectId} />
    </>
  );

  return (
    <ModalWithToolbar
      open={open}
      onClose={handleClose}
      title={title}
      onRenameTitle={isNewProject ? undefined : handleRenameProject}
      search={search}
      onSearchChange={setSearch}
      sortOptions={sortOptions}
      selectedSortKey={selectedSortKey}
      onSortChange={handleSortChange}
      sortDirection={sortDirection}
      onToggleSortDirection={toggleSortDirection}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom flex flex-col">
          {!hasContent ? (
            <div className="pt-2 flex flex-col flex-1 min-h-0">
              <ProjectModalEmptyState
                onUploadVideos={handleUploadVideos}
                onDropFiles={handleDropFiles}
              />
            </div>
          ) : (
            <ShotTree
              projectId={projectId}
              search={search}
              sortItems={sortItems}
              onClose={handleClose}
              onDropFiles={handleDropFiles}
              activeTimelineId={activeTimelineId}
            />
          )}
        </div>
        <BulkUploadPanel projectId={projectId} />
      </div>
    </ModalWithToolbar>
  );
};
