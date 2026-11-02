const MAX_SELECTABLE_TRACKS = 2;

export const isWithinTrackSelectionLimit = (selectionCount: number): boolean =>
  selectionCount <= MAX_SELECTABLE_TRACKS;
