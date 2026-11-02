export type BulkRenderingShotListSharedProps = {
  thumbnailUrlById: Record<string, string | undefined>;
  isThumbnailListLoading: boolean;
  openShotId: string | undefined;
  isShotSelected: (shotId: string) => boolean;
  onToggleShot: (shotId: string) => void;
};
