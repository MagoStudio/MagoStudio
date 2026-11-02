"use client";

import { ProjectDataWarning } from "@app/components/LibraryHealth";
import { CircularProgress } from "@components/CircularProgress";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { useSyncShotsToFolders } from "@domains/project/shotFolders/useSyncShotsToFolders";
import { useDeleteProject } from "@domains/project/useDeleteProject";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */
import { useMaskFramePlayheadCoupling } from "@domains/sam/useMaskFramePlayheadCoupling";
import { SCRIPT_TO_SHOTS_PROJECT_TYPE } from "@domains/scriptProject/constants";
import { useProjectTypeRedirect } from "@domains/scriptProject/useProjectTypeRedirect";
import { useBackfillSelectedShotId } from "@domains/shot/useBackfillSelectedShotId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useBackfillSelectedTrackIds } from "@domains/track/useBackfillSelectedTrackIds";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useGetVideoTrackReadiness } from "@domains/track/useGetVideoTrackReadiness";
import { useInitializeInputTrackId } from "@domains/track/useInitializeInputTrackId";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useSelectedTracks } from "@domains/track/useSelectedTracks";
import { AllProjectsModal } from "@home/components/dashboard/AllProjectsModal";
import { useCreateProjectTypeDialog } from "@home/components/dashboard/CreateProjectTypeDialog/useCreateProjectTypeDialog";
import { ProjectModal } from "@home/components/dashboard/ProjectModal/ProjectModal";
import { Img2ImgTool } from "@home/components/Navbar/Img2ImgModalV2/Img2ImgTool";
import { ViewportFullscreenModal } from "@home/components/Navbar/ViewportFullscreenModal";
import { OnboardingStylizeFrame } from "@home/components/onboarding/OnboardingStylizeFrame";
import { getProjectModeTabs } from "@home/components/projectModeTabs";
import { TrackSelectedPreviewArea } from "@home/components/RenderPreview/TrackSelectedPreviewArea";
import { SettingsEditor } from "@home/components/SettingsEditor";
import { TimelineList } from "@home/components/TimelineList";
import { MaskViewportOverlay } from "@home/components/VideoPreview/MaskViewportOverlay";
import { ViewportToolbar } from "@home/components/VideoPreview/PreviewButtonGroup";
import { SettingsEditorHeader } from "@home/components/VideoPreview/SettingsEditorHeader";
import { useProjectModeNavigation } from "@home/hooks/useProjectModeNavigation";
import { ProjectModeSelector } from "@home/project/components/ProjectModeSelector";
import { useTool } from "@hooks/tool/useTool";
import { useAddVideo } from "@hooks/useAddVideo";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { useTrackKeyboardNavigation } from "@hooks/useTrackKeyboardNavigation";
import type { Project } from "@schemas/project";
import {
  activeHotkeyAtom,
  useIsSettingsEditorOpenAtom,
  useLatestProjectIdAtom,
  isViewportFullscreenOpenAtom,
  isAllProjectsModalOpenAtom
} from "@store/atoms";
import { isLocalSetupPillShownAtom } from "@store/atoms/isLocalSetupPillShownAtom";
import { maskViewportActiveAtom } from "@store/maskPreviewStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { isLocalApp } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

const HelpButton = dynamic(
  () =>
    import("@home/project/components/HelpButton").then((mod) => ({
      default: mod.HelpButton
    })),
  {
    ssr: false
  }
);

const Project = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const queryClient = useQueryClient();
  const activeScope = useAtomValue(activeHotkeyAtom);
  const isLocalSetupPillShown = useAtomValue(isLocalSetupPillShownAtom);
  const [maskViewportActive, setMaskViewportActive] = useAtom(
    maskViewportActiveAtom
  );

  useMaskFramePlayheadCoupling();

  const [isViewportFullscreenOpen, setIsViewportFullscreenOpen] = useAtom(
    isViewportFullscreenOpenAtom
  );
  const [isSettingsEditorOpen, setIsSettingsEditorOpen] = useAtom(
    useIsSettingsEditorOpenAtom()
  );
  const { tool, setTool } = useTool();
  const isOnboardingActive = useIsOnboardingActive();
  const [{ step: onboardingStep }] = useOnboardingProgress();

  const { data: selectedProject, isLoading: isProjectLoading } =
    useProject(selectedProjectId);
  const isProjectsBlocking = !isLocalApp && isProjectLoading;
  const selectedTrackIds = useSelectedTrackIds() || [];
  const { data: selectedTracks } = useSelectedTracks();

  useBackfillSelectedShotId();
  useBackfillSelectedTrackIds();

  const { isVideoAvailable, hasVideoAsset } = useGetVideoTrackReadiness();

  const hasTriggeredUploadPromptRef = useRef(false);
  const [isAllProjectsModalOpen, setIsAllProjectsModalOpen] = useAtom(
    isAllProjectsModalOpenAtom
  );
  const [projectModalId, setProjectModalId] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    setIsAllProjectsModalOpen(false);
  }, [setIsAllProjectsModalOpen]);
  const [isNewlyCreatedProject, setIsNewlyCreatedProject] = useState(false);

  const { handleTabChange } = useProjectModeNavigation();

  useProjectTypeRedirect(selectedProjectId, "timeline");

  const { mutate: deleteProject } = useDeleteProject();
  const { open: handleCreateNewProject, dialog: createProjectTypeDialog } =
    useCreateProjectTypeDialog({
      onVideoProjectCreated: (newProject) => {
        setIsNewlyCreatedProject(true);
        setProjectModalId(newProject.id);
      }
    });
  const handleProjectModalClose = () => {
    if (isNewlyCreatedProject && projectModalId) {
      const project = queryClient.getQueryData<Project>(
        queryKeys.project.byId(projectModalId)
      );
      const hasContent =
        !project ||
        project.timelines?.some((timeline) => timeline.layers.length > 0);
      if (!hasContent) {
        void queryClient.cancelQueries({
          queryKey: queryKeys.projectList.all
        });
        void queryClient.cancelQueries({
          queryKey: queryKeys.homepage.all
        });
        deleteProject({
          projectId: projectModalId
        });
      }
    }
    setProjectModalId(undefined);
    setIsNewlyCreatedProject(false);
  };
  const isProjectEditableInTimelineUi =
    selectedProject?.type !== SCRIPT_TO_SHOTS_PROJECT_TYPE;

  const shouldPromptForUpload =
    !!selectedProjectId &&
    !!selectedProject &&
    isProjectEditableInTimelineUi &&
    !!selectedShotId &&
    // A shot with a source video on record but no file yet (a cloud video
    // still downloading) is loading, not empty.
    !hasVideoAsset &&
    !isProjectsBlocking &&
    !isProjectLoading;

  useSyncShotsToFolders(selectedProjectId);
  useSyncShotsToFolders(
    projectModalId !== selectedProjectId ? projectModalId : undefined
  );
  useInitializeInputTrackId();
  useTrackKeyboardNavigation();

  useHotkeys(
    "shift + s",
    () => {
      setIsSettingsEditorOpen(!isSettingsEditorOpen);
    },
    {
      enabled: activeScope === "projectView"
    },
    [isSettingsEditorOpen, setIsSettingsEditorOpen, activeScope]
  );
  const [, setLatestProjectId] = useAtom(useLatestProjectIdAtom());
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const shouldShowSettingsEditor =
    isSettingsEditorOpen && isVideoAvailable && tool !== "edit-frame";

  const showOnboardingStylizeFrame =
    isOnboardingActive && onboardingStep === "generate-image";

  const { triggerAddVideo } = useAddVideo();

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- imperative file-picker trigger on a derived load condition */
  useEffect(() => {
    if (!shouldPromptForUpload || hasTriggeredUploadPromptRef.current) return;
    hasTriggeredUploadPromptRef.current = true;
    triggerAddVideo();
  }, [shouldPromptForUpload]); // oxlint-disable-line react-hooks/exhaustive-deps -- the ref latch keeps this to a single trigger
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  useEffect(() => {
    if (selectedProjectId) {
      setLatestProjectId(selectedProjectId);
    }
  }, [selectedProjectId, setLatestProjectId]);

  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.homepage.all
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projectList.all
    });
  }, [selectedProjectId, queryClient]);

  const { t } = useTranslation();
  const isEditFrameAvailable = !!videoTrack;
  const isTeamMember = useIsTeamMember();
  const toolTabs = getProjectModeTabs({
    t,
    isEditFrameAvailable,
    isTeamMember
  });
  useEffect(() => {
    if (isProjectLoading) return;
    if (
      isOnboardingActive &&
      (onboardingStep === "generate-image" ||
        onboardingStep === "select-image") &&
      isEditFrameAvailable &&
      tool !== "edit-frame"
    ) {
      setTool("edit-frame");
      return;
    }
    if (
      isOnboardingActive &&
      onboardingStep === "render" &&
      tool !== "render-video"
    ) {
      setTool("render-video");
      return;
    }
    if (tool === "edit-frame" && !isEditFrameAvailable) {
      setTool("render-video");
    }
  }, [
    tool,
    isEditFrameAvailable,
    isProjectLoading,
    setTool,
    isOnboardingActive,
    onboardingStep
  ]);

  useEffect(() => {
    if (tool !== "mask") {
      setMaskViewportActive(false);
    }
  }, [tool, setMaskViewportActive]);

  const isProjectLeavingForAnotherUi =
    selectedProject?.type === SCRIPT_TO_SHOTS_PROJECT_TYPE;

  if (isProjectLeavingForAnotherUi) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CircularProgress size="md" color="glyph-tertiary" />
      </div>
    );
  }

  return (
    <>
      {!isLocalSetupPillShown && <HelpButton />}
      <div
        className="relative flex flex-col h-full w-full overflow-hidden"
        role="main"
      >
        <ProjectDataWarning projectId={selectedProjectId} />
        {!isProjectsBlocking && !isOnboardingActive && (
          <nav
            aria-label="Secondary navbar"
            className="relative w-full h-12 shrink-0 border-b border-b-glyph-invert-main bg-surface-primary"
          >
            <div className="flex h-full items-center">
              <ProjectModeSelector
                tabs={toolTabs}
                selectedKey={tool}
                onSelectionChange={(key) => {
                  if (key === "edit-frame" && !isEditFrameAvailable) {
                    return;
                  }
                  handleTabChange(key);
                }}
                className="h-full [&>button]:h-full"
              />
            </div>
          </nav>
        )}
        <div className="flex flex-1 min-h-0 w-full">
          {showOnboardingStylizeFrame ? (
            <div className="flex h-full w-full flex-col animate-fade-slide-in">
              <OnboardingStylizeFrame />
            </div>
          ) : tool === "edit-frame" ? (
            <Img2ImgTool />
          ) : (
            <>
              {!isProjectsBlocking && isVideoAvailable && (
                <div className="flex flex-col min-h-0 w-full">
                  <div className="flex flex-col flex-1 min-h-0 w-full">
                    {!(maskViewportActive && tool === "mask") && (
                      <div className={"flex w-full"}>
                        <SettingsEditorHeader />
                        <ViewportToolbar />
                      </div>
                    )}

                    <div className="relative flex flex-1 min-h-0 w-full border-t border-t-glyph-invert-main">
                      {shouldShowSettingsEditor && (
                        <div
                          data-onboarding-id="pf-settings-editor"
                          className={
                            "relative flex flex-col gap-2 py-1 isolate bg-surface-secondary w-track-settings shrink-0 overflow-hidden"
                          }
                        >
                          <div className="flex flex-col flex-1 min-h-0">
                            <SettingsEditor />
                          </div>
                        </div>
                      )}

                      {maskViewportActive && tool === "mask" ? (
                        <MaskViewportOverlay />
                      ) : (
                        <div className="relative overflow-hidden flex flex-col justify-center items-center self-stretch flex-1 min-w-0 bg-surface-secondary border-l border-l-glyph-invert-main">
                          {selectedProject && selectedTrackIds.length > 0 && (
                            <TrackSelectedPreviewArea />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!maskViewportActive && (
                <div
                  data-testid="timeline-isolate-root"
                  className="ml-auto h-full shrink-0 isolate"
                >
                  <TimelineList />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ViewportFullscreenModal
        open={isViewportFullscreenOpen}
        onClose={() => setIsViewportFullscreenOpen(false)}
        trackName={selectedTracks?.[0]?.name || ""}
      >
        {selectedProject && selectedTrackIds.length > 0 && (
          <TrackSelectedPreviewArea />
        )}
      </ViewportFullscreenModal>
      {isAllProjectsModalOpen && (
        <AllProjectsModal
          onClose={() => setIsAllProjectsModalOpen(false)}
          onCreateProject={handleCreateNewProject}
        />
      )}
      {createProjectTypeDialog}
      <ProjectModal
        open={!!projectModalId}
        onClose={handleProjectModalClose}
        projectId={projectModalId}
        activeTimelineId={selectedShotId}
      />
    </>
  );
};

export default Project;
