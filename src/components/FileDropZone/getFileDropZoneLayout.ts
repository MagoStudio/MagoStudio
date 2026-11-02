export type FileDropZoneSize = "medium" | "small";

const SMALL_EMPTY_CLASS = "grid gap-2 auto-rows-[114px] grid-cols-1" as const;

const SMALL_SQUARE_CELLS_CLASS =
  "grid gap-2 auto-rows-[114px] grid-cols-[repeat(auto-fill,114px)]" as const;

const MEDIUM_WITH_IMAGES_CLASS = "grid grid-cols-2 gap-4" as const;

const MEDIUM_SINGLE_COLUMN_CLASS = "flex flex-col gap-6" as const;

type FileDropZoneLayoutClass =
  | typeof SMALL_EMPTY_CLASS
  | typeof SMALL_SQUARE_CELLS_CLASS
  | typeof MEDIUM_WITH_IMAGES_CLASS
  | typeof MEDIUM_SINGLE_COLUMN_CLASS;

export const getFileDropZoneLayout = ({
  count,
  maxFileUpload,
  size = "medium"
}: {
  count: number;
  maxFileUpload: number;
  size?: FileDropZoneSize;
}): FileDropZoneLayoutClass => {
  const isUploadSlotAvailable = count < maxFileUpload;
  const hasImages = count > 0;

  if (size === "small") {
    return hasImages ? SMALL_SQUARE_CELLS_CLASS : SMALL_EMPTY_CLASS;
  }

  return hasImages && isUploadSlotAvailable
    ? MEDIUM_WITH_IMAGES_CLASS
    : MEDIUM_SINGLE_COLUMN_CLASS;
};
