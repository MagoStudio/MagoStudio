import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { QueueItem } from "@hooks/queue/interface";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import { useIsSettingsEditorOpenAtom, viewModeAtom } from "@store/atoms";
import { useAtom } from "jotai";

import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";
import { useSelectedTrackIds } from "./useSelectedTrackIds";
import { useSetSelectedTrackIds } from "./useSetSelectedTrackIds";
import { checkIfShouldOpenTrackSettingsDrawer } from "./utils/checkIfShouldOpenTrackSettingsDrawer";
import { getNewTracksSelection } from "./utils/getNewTracksSelection";
import { isWithinTrackSelectionLimit } from "./utils/isWithinTrackSelectionLimit";
import { updateViewModeIfNeeded } from "./utils/updateViewModeIfNeeded";

export const useChangeSelectedTracks = () => {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const selectedTrackIds = useSelectedTrackIds();
  const setSelectedTrackIds = useSetSelectedTrackIds();

  const [isTrackSettingsDrawerOpen, setIsTrackSettingsDrawerOpen] = useAtom(
    useIsSettingsEditorOpenAtom()
  );
  const { mutateAsync: updateTrack } = useUpdateTrack();

  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();
  const allTracks = [videoTrack, ...tracks];
  const onSelectedTracksChange = ({
    clickedTrack,
    renderStatus,
    isMultiSelect,
    setIsPlaying
  }: {
    clickedTrack: Layer;
    renderStatus?: QueueItem["status"];
    isMultiSelect: boolean;
    setIsPlaying: (value: boolean) => void;
  }) => {
    const isFirstSourceVideo = clickedTrack.id === videoTrack.id;

    if (!clickedTrack) {
      return;
    }

    if (
      !isFirstSourceVideo &&
      !clickedTrack.data.hasBeenInteractedWithSinceRenderFinished &&
      renderStatus === "FINISHED"
    ) {
      updateTrack({
        layerId: clickedTrack.id,
        layerName: clickedTrack.name,
        layerData: {
          ...clickedTrack.data,
          hasBeenInteractedWithSinceRenderFinished: true
        }
      }).catch((error: unknown) => {
        console.error(
          "Failed to mark track as interacted with after render finished:",
          error
        );
      });
    }
    const newTracksSelectionIds = getNewTracksSelection(
      clickedTrack.id,
      selectedTrackIds,
      isMultiSelect
    );

    const areSelectionsEqual =
      selectedTrackIds.length === newTracksSelectionIds.length &&
      selectedTrackIds.every((id) => newTracksSelectionIds.includes(id));

    trackingUtils.trackActions.click(clickedTrack.id);

    if (areSelectionsEqual) {
      return;
    }

    if (newTracksSelectionIds.length > 1) {
      setIsTrackSettingsDrawerOpen(false);
    }
    if (newTracksSelectionIds.length === 1) {
      const shouldOpenTrackSettingsDrawer =
        checkIfShouldOpenTrackSettingsDrawer(
          newTracksSelectionIds,
          clickedTrack,
          isTrackSettingsDrawerOpen
        );

      if (shouldOpenTrackSettingsDrawer) {
        setIsTrackSettingsDrawerOpen(true);
      }
    }
    if (!isWithinTrackSelectionLimit(newTracksSelectionIds.length)) {
      return;
    }
    setSelectedTrackIds(newTracksSelectionIds);

    setIsPlaying(false);

    const newSelectedTracks: Layer[] = newTracksSelectionIds
      .map((id) => allTracks.find((track: Layer) => track.id === id))
      .filter((track): track is Layer => !!track);

    const newSelectedTracksCount = newSelectedTracks.length;

    updateViewModeIfNeeded({
      newSelectedTracksCount,
      viewMode,
      setViewMode
    });
  };
  return {
    onSelectedTracksChange
  };
};
