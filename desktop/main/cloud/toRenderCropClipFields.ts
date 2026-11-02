import {
  CropCoordinates,
  readCropCoordinates,
  readSourceDimensions
} from "../imageRenders/cropPlan";

export interface RenderCropClipFields {
  crop_coordinates?: CropCoordinates;
  source_video_dimensions?: [number, number];
}

export const toRenderCropClipFields = (
  renderSettings: Record<string, unknown>
): RenderCropClipFields => {
  const cropCoordinates = readCropCoordinates(renderSettings.crop_coordinates);
  const sourceVideoDimensions = readSourceDimensions(
    renderSettings.source_video_dimensions
  );
  if (!cropCoordinates || !sourceVideoDimensions) return {};
  return {
    crop_coordinates: cropCoordinates,
    source_video_dimensions: sourceVideoDimensions
  };
};
