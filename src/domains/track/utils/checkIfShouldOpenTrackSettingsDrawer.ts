import { Layer, LayerType } from "@schemas/layer";

export const checkIfShouldOpenTrackSettingsDrawer = (
  newTracksSelectionIds: string[],
  clickedTrack: Layer,
  isTrackSettingsDrawerOpen: boolean
) => {
  if (isTrackSettingsDrawerOpen) {
    return false;
  }

  const isNewlySelectedTrackTheOnlySelectedTrack =
    newTracksSelectionIds.length === 1 &&
    newTracksSelectionIds[0] === clickedTrack.id;

  if (!isNewlySelectedTrackTheOnlySelectedTrack) {
    return false;
  }

  const isNewlySelectedTrackTheVideoTrack =
    clickedTrack.type === LayerType.IMAGE.toUpperCase();

  if (isNewlySelectedTrackTheVideoTrack) {
    return false;
  }

  const isNewlySelectedTrackAlreadyRendered = clickedTrack.clips?.length > 0;

  if (isNewlySelectedTrackAlreadyRendered) {
    return false;
  }

  return true;
};
