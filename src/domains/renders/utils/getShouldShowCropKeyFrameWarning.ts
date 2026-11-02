import { SourceImage } from "@domains/renders/types";
import { buildMagoImageSources } from "@domains/renders/utils/buildMagoImageSources";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackCropSettings } from "@domains/track/utils/getTrackCropSettings";
import { VideoModelDefinition } from "@models/video/types";
import { Layer } from "@schemas/layer";

import {
  isShotCroppedSectionOfInputVideo,
  NormalizedCropRect
} from "./cropRect";

export const getShouldShowCropKeyFrameWarning = ({
  crop,
  model,
  sources,
  tracks
}: {
  crop: NormalizedCropRect | undefined;
  model: VideoModelDefinition;
  sources: SourceImage[];
  tracks: Layer[];
}): boolean => {
  const isShotCroppedSection = isShotCroppedSectionOfInputVideo({ crop });
  if (!isShotCroppedSection) return false;

  const wireSources = buildMagoImageSources(model.name, sources);
  const keyFrameEntry = wireSources.find((entry) => entry.type === "key_frame");
  if (!keyFrameEntry) return false;

  const originatingTrack = tracks.find(
    (track) => getTrackAssetId(track) === keyFrameEntry.asset_id
  );
  const cropSettings = getTrackCropSettings(originatingTrack);

  return !cropSettings;
};
