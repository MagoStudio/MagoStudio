import { Clip } from "@schemas/clip";

export interface SourceImageCrop {
  crop_coordinates: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  source_video_dimensions: [number, number];
}

export const getImg2ImgClipCrop = (
  clip: Clip | undefined
): SourceImageCrop | undefined => {
  const settings = clip?.data?.settings as
    | {
        crop_coordinates?: SourceImageCrop["crop_coordinates"];
        source_video_dimensions?: SourceImageCrop["source_video_dimensions"];
      }
    | undefined;

  if (!settings?.crop_coordinates || !settings.source_video_dimensions) {
    return undefined;
  }

  return {
    crop_coordinates: settings.crop_coordinates,
    source_video_dimensions: settings.source_video_dimensions
  };
};
