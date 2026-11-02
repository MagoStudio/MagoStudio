import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

import { buildOptimisticTrackAssetData } from "./buildOptimisticTrackAssetData";

export const buildMockTrackDuringGeneration = ({
  track,
  frameRange,
  renderSettingsValues,
  inputTrackId,
  fps
}: {
  track: Layer;
  frameRange: [number, number];
  renderSettingsValues: VideoSettings;
  inputTrackId: string;
  fps: number;
}): Layer => ({
  ...track,
  data: {
    ...track.data,
    skeletonFrameRange: frameRange
  },
  clips: [
    {
      ...track.clips[0],
      data: {
        ...track.clips[0]?.data,
        timeline_offset: frameRange[0],
        duration: frameRange[1] - frameRange[0],
        sources: {
          ...track.clips[0]?.data?.sources,
          video: inputTrackId
        }
      },
      asset: {
        ...track.clips[0]?.asset,
        data: buildOptimisticTrackAssetData({
          existingAssetData: track.clips[0]?.asset?.data,
          trackId: track.id,
          frameRange,
          renderSettingsValues,
          fps
        })
      }
    }
  ]
});
