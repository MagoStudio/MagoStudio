export const getNewTracksSelection = (
  clickedTrackId: string,
  selectedTrackIds: string[],
  isMultiSelect: boolean
) => {
  const isRemovingTrack = selectedTrackIds.includes(clickedTrackId);

  if (isMultiSelect && isRemovingTrack) {
    return selectedTrackIds.filter((id) => id !== clickedTrackId);
  }

  if (isMultiSelect) {
    return [...selectedTrackIds, clickedTrackId];
  }

  return [clickedTrackId];
};
