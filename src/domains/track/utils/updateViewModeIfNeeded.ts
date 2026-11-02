import { PreviewMode } from "@store/atoms";

type PreviewModeType = "singlePreview" | "sbs" | "twoPreviews";

export const updateViewModeIfNeeded = ({
  newSelectedTracksCount,
  viewMode,
  setViewMode
}: {
  newSelectedTracksCount: number;
  viewMode: PreviewModeType;
  setViewMode: (viewMode: PreviewMode) => void;
}) => {
  if (newSelectedTracksCount === 1) {
    setViewMode(PreviewMode.SINGLE);
    return;
  }

  if (viewMode !== PreviewMode.TWO) {
    setViewMode(PreviewMode.TWO);
  }
};
