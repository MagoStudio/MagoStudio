import { VideoSettings } from "@models/video/types";
import { Asset } from "@schemas/asset";

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_SIZE: [number, number] = [DEFAULT_WIDTH, DEFAULT_HEIGHT];

export const buildOptimisticTrackAssetData = ({
  existingAssetData,
  trackId,
  frameRange,
  renderSettingsValues,
  fps
}: {
  existingAssetData: Asset["data"];
  trackId: string;
  frameRange: [number, number];
  renderSettingsValues: VideoSettings;
  fps: number;
}): Asset["data"] => ({
  ...existingAssetData,
  duration: frameRange[1] - frameRange[0],
  processed: false,
  fps,
  size: existingAssetData?.size || DEFAULT_SIZE,
  data: {
    ...existingAssetData?.data,
    parent_layer_id: trackId,
    render_settings: {
      magov2: renderSettingsValues
    }
  },
  renderEngine: "magov2",
  parent_render: trackId,
  hasBeenInteractedWithSinceRenderFinished: false,
  error: undefined,
  thumbnails: []
});
