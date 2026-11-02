import { buildOptimisticTrackAssetData } from "@domains/track/utils/buildOptimisticTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { VideoSettings } from "@models/video/types";
import { AssetType } from "@schemas/asset";
import { Clip } from "@schemas/clip";
import { Layer } from "@schemas/layer";

const PENDING_RENDER_HAS_NO_ASSET_ID = "";

const buildPlaceholderClip = (track: Layer): Clip => ({
  id: `${track.id}-placeholder-clip`,
  layer_id: track.id,
  name: track.name,
  asset_id: PENDING_RENDER_HAS_NO_ASSET_ID,
  asset: {
    id: PENDING_RENDER_HAS_NO_ASSET_ID,
    name: track.name,
    filepath: "",
    type: AssetType.RENDER,
    created_at: track.created_at,
    updated_at: track.created_at,
    origin: "generated",
    last_used: track.created_at,
    rate: 0,
    data: {}
  },
  data: {}
});

export const buildMockImageToVideoTrackDuringGeneration = ({
  track,
  frameRange,
  renderSettingsValues,
  fps
}: {
  track: Layer;
  frameRange: [number, number];
  renderSettingsValues: VideoSettings;
  fps: number;
}): Layer => {
  const existingClip = getTrackClip(track) ?? buildPlaceholderClip(track);

  return {
    ...track,
    data: {
      ...track.data,
      skeletonFrameRange: frameRange
    },
    clips: [
      {
        ...existingClip,
        data: {
          ...existingClip.data,
          timeline_offset: frameRange[0],
          duration: frameRange[1] - frameRange[0]
        },
        asset: {
          ...existingClip.asset,
          data: buildOptimisticTrackAssetData({
            existingAssetData: existingClip.asset.data,
            trackId: track.id,
            frameRange,
            renderSettingsValues,
            fps
          })
        }
      }
    ]
  };
};
