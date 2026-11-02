import { useLastViewedTimelineId } from "@domains/project/useLastViewedTimelineId";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useTimelineList } from "@domains/project/useTimelineList";
import { useEffect } from "react";

import { useSelectedShotId } from "./useSelectedShotId";
import { useUnnavigableShotIds } from "./useUnnavigableShotIds";
import { resolveDefaultShotId } from "./utils/resolveDefaultShotId";

export const useBackfillSelectedShotId = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId, setSelectedShotId } = useSelectedShotId();
  const { timelineIdsByMostRecentlyEdited, isLoading: isTimelineListLoading } =
    useTimelineList(selectedProjectId);
  const { lastViewedTimelineId, setLastViewedTimelineId, isUserLoaded } =
    useLastViewedTimelineId(selectedProjectId);
  const { unnavigableShotIds, isUnnavigableShotIdsLoading } =
    useUnnavigableShotIds(selectedProjectId);

  const defaultShotId = resolveDefaultShotId({
    lastViewedShotId: lastViewedTimelineId,
    shotIdsByMostRecentlyEdited: timelineIdsByMostRecentlyEdited,
    excludedShotIds: unnavigableShotIds
  });

  const shouldBackfillShot =
    !selectedShotId &&
    !!selectedProjectId &&
    !isTimelineListLoading &&
    !isUnnavigableShotIdsLoading &&
    isUserLoaded &&
    !!defaultShotId;

  // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- external sync: writes the resolved default shot into the URL once the timeline list has loaded
  useEffect(() => {
    if (!shouldBackfillShot) {
      return;
    }
    setSelectedShotId(defaultShotId);
  }, [shouldBackfillShot, defaultShotId, setSelectedShotId]);

  const shouldRememberSelectedShot =
    isUserLoaded && !!selectedShotId && lastViewedTimelineId !== selectedShotId;

  // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- external sync: mirrors the selected shot into localStorage, required by the project-default-timeline spec
  useEffect(() => {
    if (!shouldRememberSelectedShot) {
      return;
    }
    setLastViewedTimelineId(selectedShotId);
  }, [shouldRememberSelectedShot, selectedShotId, setLastViewedTimelineId]);
};
