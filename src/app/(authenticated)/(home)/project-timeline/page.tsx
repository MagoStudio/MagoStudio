"use client";
import { ProjectDataWarning } from "@app/components/LibraryHealth";
import { Text } from "@components/Text";
import { useProjectTimelineData } from "@domains/project/useProjectTimelineData";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { AllProjectsModal } from "@home/components/dashboard/AllProjectsModal";
import {
  getProjectModeTabs,
  GLOBAL_TIMELINE_TAB_ID
} from "@home/components/projectModeTabs";
import { useProjectModeNavigation } from "@home/hooks/useProjectModeNavigation";
import { ImageToVideoModal } from "@home/project-timeline/components/ImageToVideoModal/ImageToVideoModal";
import { ProjectTimelineHotkeys } from "@home/project-timeline/components/ProjectTimelineHotkeys";
import { ProjectTimelinePanel } from "@home/project-timeline/components/ProjectTimelinePanel";
import { ProjectTimelineToolbar } from "@home/project-timeline/components/ProjectTimelineToolbar";
import { ProjectTimelineViewport } from "@home/project-timeline/components/ProjectTimelineViewport";
import { usePreventCloseWhileDownloading } from "@home/project-timeline/hooks/usePreventCloseWhileDownloading";
import { ProjectModeSelector } from "@home/project/components/ProjectModeSelector";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import {
  activeTimelineDownloadsAtom,
  isAllProjectsModalOpenAtom
} from "@store/atoms";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

export default function ProjectTimelinePage() {
  const { t } = useTranslation();
  const projectId = useSelectedProjectId();
  const { shots, totalDurationFrames, fps, isLoading, pinnedTrackIds } =
    useProjectTimelineData(projectId);
  const { handleTabChange } = useProjectModeNavigation();
  const isTeamMember = useIsTeamMember();
  const projectModeTabs = getProjectModeTabs({ t, isTeamMember });

  usePreventCloseWhileDownloading();
  const activeDownloads = useAtomValue(activeTimelineDownloadsAtom);
  const handleGuardedTabChange = (key: string) => {
    if (
      activeDownloads > 0 &&
      !window.confirm(
        t("notifications.timeline_download_navigation_warning.description")
      )
    ) {
      return;
    }
    handleTabChange(key);
  };
  const [isAllProjectsModalOpen, setIsAllProjectsModalOpen] = useAtom(
    isAllProjectsModalOpenAtom
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Text component="p" variant="base" color="glyph-secondary">
          Loading...
        </Text>
      </div>
    );
  }

  return (
    <>
      {isAllProjectsModalOpen && (
        <AllProjectsModal onClose={() => setIsAllProjectsModalOpen(false)} />
      )}
      <ImageToVideoModal />
      <div
        className="relative isolate flex h-full w-full min-w-0 flex-col overflow-hidden"
        data-testid="project-timeline-page"
      >
        <ProjectDataWarning projectId={projectId} />
        <nav
          aria-label="Secondary navbar"
          className="relative w-full h-12 shrink-0 border-b border-b-glyph-invert-main bg-surface-secondary-opacity-90"
        >
          <div className="flex h-full items-center">
            <ProjectModeSelector
              tabs={projectModeTabs}
              selectedKey={GLOBAL_TIMELINE_TAB_ID}
              onSelectionChange={handleGuardedTabChange}
              className="h-full [&>button]:h-full"
            />
          </div>
        </nav>
        <ProjectTimelineViewport
          shots={shots}
          totalDurationFrames={totalDurationFrames}
          fps={fps}
          pinnedTrackIds={pinnedTrackIds}
        />
        <ProjectTimelineHotkeys totalDurationFrames={totalDurationFrames} />
        <ProjectTimelineToolbar shots={shots} pinnedTrackIds={pinnedTrackIds} />
        <ProjectTimelinePanel
          shots={shots}
          totalDurationFrames={totalDurationFrames}
          fps={fps}
          pinnedTrackIds={pinnedTrackIds}
        />
      </div>
    </>
  );
}
