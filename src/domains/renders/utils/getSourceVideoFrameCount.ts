import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { AssetType } from "@schemas/asset";
import { Layer } from "@schemas/layer";

const getTrackVideoFrameCount = (
  track: Layer | undefined
): number | undefined => {
  const asset = getTrackAsset(track);
  if (!asset) return undefined;
  const isVideoAsset = !asset.type || asset.type === AssetType.VIDEO;
  return isVideoAsset ? asset.data?.total_frames : undefined;
};

export const getSourceVideoFrameCount = (
  sourceTrack: Layer | undefined,
  shotVideoTrack: Layer | undefined
): number | undefined =>
  getTrackVideoFrameCount(sourceTrack) ??
  getTrackVideoFrameCount(shotVideoTrack);
