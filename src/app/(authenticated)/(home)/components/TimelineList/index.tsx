import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { memo } from "react";

import { useFilteredAndSortedTracks } from "@/domains/track/useFilteredAndSortedTracks";
import { getTrackAsset } from "@/domains/track/utils/getTrackAsset";

import { SkeletonTrackList } from "./SkeletonTrackList";
import { TimelineListDummy } from "./TimelineListDummy";
import { TimelineListWithContent } from "./TimelineListWithContent";

export const TimelineList = memo(() => {
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);

  const currentShot = selectedProject?.timelines?.[0];

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();
  const videoAsset = getTrackAsset(videoTrack);

  const initialLoadComplete =
    currentShot && videoTrack && videoAsset !== undefined;

  if (!currentShot || !initialLoadComplete) {
    return (
      <div className="relative flex flex-col items-end w-timeline h-[calc(100vh-var(--height-navbar)-var(--height-secondary-navbar))] self-start bg-surface-secondary backdrop-blur-xl">
        <TimelineListDummy>
          <div className="mt-3">
            <SkeletonTrackList />
          </div>
        </TimelineListDummy>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-end w-timeline h-[calc(100vh-var(--height-navbar)-var(--height-secondary-navbar))] self-start bg-surface-secondary backdrop-blur-xl border-l border-l-glyph-invert-main"
      data-onboarding-id="pf-timeline"
    >
      <TimelineListWithContent currentShot={currentShot} />
    </div>
  );
});

TimelineList.displayName = "TimelineList";
