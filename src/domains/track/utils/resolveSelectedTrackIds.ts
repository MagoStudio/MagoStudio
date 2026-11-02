export const resolveSelectedTrackIds = ({
  trackIdsFromUrl,
  videoTrackId,
  selectableTrackIds
}: {
  trackIdsFromUrl: string[];
  videoTrackId: string | undefined;
  selectableTrackIds: string[];
}): string[] => {
  const videoTrackFallback = videoTrackId ? [videoTrackId] : [];

  if (trackIdsFromUrl.length === 0) {
    return videoTrackFallback;
  }

  const selectableTrackIdSet = new Set(selectableTrackIds);
  const trackIdsStillSelectable = trackIdsFromUrl.filter((trackId) =>
    selectableTrackIdSet.has(trackId)
  );

  return trackIdsStillSelectable.length > 0
    ? trackIdsStillSelectable
    : videoTrackFallback;
};
