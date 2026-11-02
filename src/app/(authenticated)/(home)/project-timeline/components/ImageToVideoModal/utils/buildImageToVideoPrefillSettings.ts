import { ImageAssetResponse } from "@domains/asset/interface";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

export const buildImageToVideoPrefillSettings = (
  render: Layer,
  startImageAsset: ImageAssetResponse | undefined
): VideoSettings | undefined => {
  const renderSettings = getTrackRenderSettings(render);
  if (!renderSettings) return undefined;

  const hasStartImageReference =
    typeof renderSettings.image_id === "string" &&
    renderSettings.image_id.length > 0;

  if (hasStartImageReference && !startImageAsset) {
    return { ...renderSettings, image_id: undefined };
  }

  return renderSettings;
};
