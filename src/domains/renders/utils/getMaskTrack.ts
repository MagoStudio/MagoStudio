import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

export const getMaskTrack = (
  renderSettingsValues: VideoSettings,
  tracks: Layer[]
): Layer | undefined => {
  const maskTrackId =
    typeof renderSettingsValues.input_mask === "string"
      ? renderSettingsValues.input_mask
      : undefined;
  if (!maskTrackId) return undefined;
  return tracks.find((track) => track.id === maskTrackId);
};
