type ProjectCoverSources = {
  preview_url: string | null;
  sheet_preview_urls?: (string | null)[];
};

export const pickProjectCoverImageUrl = ({
  preview_url,
  sheet_preview_urls
}: ProjectCoverSources): string | null =>
  preview_url ??
  sheet_preview_urls?.find((sheetPreviewUrl) => !!sheetPreviewUrl) ??
  null;
