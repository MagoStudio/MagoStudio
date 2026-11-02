"use client";

import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useProjectShotsToolbar } from "@home/components/dashboard/hooks/useProjectShotsToolbar";
import { BulkDeleteToolbarButton } from "@home/components/dashboard/ProjectModal/BulkDeleteToolbarButton";
import { BulkUploadPanel } from "@home/components/dashboard/ProjectModal/BulkUploadPanel";
import { ShotTree } from "@home/components/dashboard/ProjectModal/ShotTree";
import { ShotsToolbar } from "@home/components/dashboard/shared/ShotsToolbar";
import { useAddVideo } from "@hooks/useAddVideo";
import { isShotsPanelOpenAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

export const ShotsPanel: React.FC = () => {
  const projectId = useSelectedProjectId();
  const { selectedShotId: activeTimelineId } = useSelectedShotId();
  const setIsShotsPanelOpen = useSetAtom(isShotsPanelOpenAtom);
  const { t } = useTranslation();
  const { data: project } = useProject(projectId);

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
    bulkUploadState,
    cancelAllUploads,
    hideBulkUploadPanel
  } = useProjectShotsToolbar(projectId);
  const { triggerAddVideo, addVideoFiles } = useAddVideo();

  const { mutateAsync: updateProject } = useUpdateProject();

  const handleRenameProject = (newName: string) => {
    if (!projectId || !project) return;
    void updateProject({
      projectId,
      projectName: newName,
      projectDescription: project.description,
      settings: project.settings,
      settingsPatch: {}
    });
  };

  const handleClose = () => {
    if (bulkUploadState.isUploadInProgress) {
      const confirmed = window.confirm(
        t("notifications.upload_cancel_confirm.description")
      );
      if (!confirmed) return;
      cancelAllUploads();
    }
    hideBulkUploadPanel();
    setIsShotsPanelOpen(false);
  };

  return (
    <div data-testid="drawer-isolate-root" className="isolate">
      <div
        data-testid="drawer-scrim"
        className="fixed inset-0 z-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        data-testid="shots-panel"
        className="fixed left-[var(--app-sidebar-current-width)] bottom-0 z-10 w-shots-panel flex flex-col bg-surface-secondary border border-glyph-stroke rounded-[20px] shadow-[0_0_32px_16px_rgba(0,0,0,0.40)] overflow-hidden"
        style={{ top: "calc(var(--height-toolbar) + 48px)" }}
      >
        <div className="flex items-center gap-2 pl-4 pr-3 py-3 shrink-0">
          <InlineEditableText
            value={project?.name ?? ""}
            onSave={handleRenameProject}
            inputClassName="text-sm font-bold"
            className="flex-1 min-w-0"
          >
            <Text
              component="p"
              variant="sm"
              weight="bold"
              color="glyph-secondary"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {project?.name ?? ""}
            </Text>
          </InlineEditableText>
          <IconActionButton
            icon={<Icon iconSet="24" iconName="close" />}
            size="sm"
            onPress={handleClose}
            aria-label={t("actions.close.label")}
            className="shrink-0"
          />
        </div>
        <div className="pl-3 pr-3 shrink-0">
          <ShotsToolbar
            search={search}
            onSearchChange={setSearch}
            sortOptions={sortOptions}
            selectedSortKey={selectedSortKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onToggleSortDirection={toggleSortDirection}
            secondaryActions={
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
            }
            primaryAction={
              <MainButton
                size="md"
                startIcon={
                  <Icon iconSet="16" iconName="upload" className="h-4 w-4" />
                }
                onPress={triggerAddVideo}
                aria-label={t("actions.add_video.label")}
              >
                {t("actions.add.label")}
              </MainButton>
            }
          />
        </div>
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom pl-3 pr-5">
            <ShotTree
              projectId={projectId}
              search={search}
              sortItems={sortItems}
              onDropFiles={addVideoFiles}
              activeTimelineId={activeTimelineId}
            />
          </div>
          <BulkUploadPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
};
