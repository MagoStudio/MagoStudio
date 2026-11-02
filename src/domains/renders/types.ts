export type SourceImageType =
  | "reference_frame"
  | "key_frame"
  | "element_reference"
  | "element_frontal"
  | "motion_reference"
  | "style_reference";

export interface SourceImage {
  asset_id: string;
  type: SourceImageType;
  /**
   * `key_frame`: the output frame index the image anchors.
   * `element_reference` / `element_frontal`: the element-group ordinal that
   * pairs the two halves of a Kling element (0 for the single element today).
   * Unused for the other roles.
   */
  index?: number;
  crop_coordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  source_video_dimensions?: [number, number];
}

export const MAX_SOURCE_IMAGES = 64;
