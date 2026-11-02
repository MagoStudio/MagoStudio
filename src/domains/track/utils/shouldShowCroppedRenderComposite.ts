import { Layer } from "@schemas/layer";

import { getTrackCropSettings } from "./getTrackCropSettings";

export const shouldShowCroppedRenderComposite = ({
  selectedTrack,
  inputVideoTrack
}: {
  selectedTrack: Layer | undefined;
  inputVideoTrack: Layer | undefined;
}): boolean => {
  if (!selectedTrack || !inputVideoTrack) return false;
  if (selectedTrack.id === inputVideoTrack.id) return false;

  return !!getTrackCropSettings(selectedTrack);
};
