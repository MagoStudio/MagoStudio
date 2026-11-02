export const STORYBOARD_SHEET_TOKEN_PREFIX = "storyboard_";

export const buildStoryboardSheetToken = (shotTimelineId: string): string =>
  `${STORYBOARD_SHEET_TOKEN_PREFIX}${shotTimelineId.replace(/-/g, "_")}`;
