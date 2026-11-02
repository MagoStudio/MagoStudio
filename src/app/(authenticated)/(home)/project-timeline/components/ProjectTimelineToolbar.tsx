"use client";

import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import { TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useDownloadPinnedClips } from "@hooks/files/useDownloadPinnedClips";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { projectTimelineZoomIndexAtom } from "../atoms";
import { ZOOM_LEVELS } from "../constants";

const TOOLBAR_MIN_HEIGHT = 32;

interface ProjectTimelineToolbarProps {
  shots: TimelineShotEntry[];
  pinnedTrackIds: Record<string, string>;
}

export function ProjectTimelineToolbar({
  shots,
  pinnedTrackIds
}: ProjectTimelineToolbarProps) {
  const { t } = useTranslation();
  const [zoomIndex, setZoomIndex] = useAtom(projectTimelineZoomIndexAtom);
  const zoomPercent = ZOOM_LEVELS[zoomIndex];
  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;

  const projectId = useSelectedProjectId();
  const { data: project } = useProject(projectId);
  const projectName = project?.name ?? "Untitled";

  const {
    downloadPinnedClips,
    isDownloading: isDownloadingPinned,
    canDownload: canDownloadPinned
  } = useDownloadPinnedClips({ shots, pinnedTrackIds, projectName, projectId });

  return (
    <div
      className="flex items-center justify-end gap-1 pr-1 shrink-0 bg-surface-secondary border border-glyph-invert-main"
      style={{ minHeight: TOOLBAR_MIN_HEIGHT }}
      data-testid="project-timeline-toolbar"
    >
      <GhostButton
        startIcon={<Icon iconSet="16" iconName="download" />}
        onPress={downloadPinnedClips}
        isDisabled={!canDownloadPinned}
        loading={isDownloadingPinned}
        data-testid="timeline-download-pinned"
      >
        {t("actions.download_pinned.label")}
      </GhostButton>
      <IconActionButton
        icon={<Icon iconSet="16" iconName="zoom-out" />}
        aria-label={t("projectTimeline.zoomOut.label")}
        isDisabled={!canZoomOut}
        onPress={() => setZoomIndex(zoomIndex - 1)}
      />
      <Text component="span" variant="xs" color="glyph-secondary">
        {`${zoomPercent}%`}
      </Text>
      <IconActionButton
        icon={<Icon iconSet="16" iconName="zoom-in" />}
        aria-label={t("projectTimeline.zoomIn.label")}
        isDisabled={!canZoomIn}
        onPress={() => setZoomIndex(zoomIndex + 1)}
      />
    </div>
  );
}
