import { SourceImage } from "@domains/renders/types";
import {
  NormalizedCropRect,
  toNormalizedCropRectFromWireFields
} from "@domains/renders/utils/cropRect";
import { VideoSettings } from "@models/video/types";

interface BackendImage {
  asset_id?: string;
  type?: string;
  index?: number;
  category?: unknown;
}

interface BackendSources {
  video?: string;
  input_mask?: string;
  images?: BackendImage[];
  ipadapter_image_source?: string;
}

interface BackendRenderData {
  sources?: BackendSources;
  render_settings?: {
    magov2?: Record<string, unknown>;
  };
}

const SOURCE_IMAGE_TYPES = new Set<SourceImage["type"]>([
  "reference_frame",
  "key_frame",
  "element_reference",
  "element_frontal",
  "motion_reference",
  "style_reference"
]);

const INDEXED_ROLES = new Set<SourceImage["type"]>([
  "key_frame",
  "element_reference",
  "element_frontal"
]);

const dropReferenceFramesShadowedByKeyFrame = (
  entries: SourceImage[]
): SourceImage[] => {
  const keyFrameAssetIds = new Set(
    entries
      .filter((entry) => entry.type === "key_frame")
      .map((entry) => entry.asset_id)
  );
  return entries.filter(
    (entry) =>
      entry.type !== "reference_frame" || !keyFrameAssetIds.has(entry.asset_id)
  );
};

const isValidImage = (
  image: BackendImage
): image is Required<Pick<BackendImage, "asset_id" | "type">> &
  BackendImage => {
  return (
    typeof image.asset_id === "string" &&
    SOURCE_IMAGE_TYPES.has(image.type as SourceImage["type"])
  );
};

interface LegacyElement {
  reference_image_id?: string[] | string;
  frontal_image_id?: string;
}

/**
 * Reconstruct the unified `sources` list from a render's legacy per-model image
 * fields (used only when the render has no typed `sources.images`): `elements`
 * → element roles, `image_id` → motion_reference, `image_ids` /
 * `reference_image_ids` → reference_frame. Also reads the FE form-field forms
 * (`reference_image_id` + `frontal_image_id`) surfaced by
 * `formatValuesForFrontend` during a reuse.
 */
const legacyImagesFromSettings = (
  magov2: Record<string, unknown>
): SourceImage[] => {
  const result: SourceImage[] = [];

  const elements = magov2.elements;
  if (Array.isArray(elements)) {
    elements.forEach((raw, index) => {
      const element = raw as LegacyElement;
      const reference = Array.isArray(element.reference_image_id)
        ? element.reference_image_id[0]
        : element.reference_image_id;
      if (typeof reference === "string" && reference.length > 0) {
        result.push({ asset_id: reference, type: "element_reference", index });
      }
      if (
        typeof element.frontal_image_id === "string" &&
        element.frontal_image_id.length > 0
      ) {
        result.push({
          asset_id: element.frontal_image_id,
          type: "element_frontal",
          index
        });
      }
    });
  } else if (
    typeof magov2.reference_image_id === "string" &&
    magov2.reference_image_id.length > 0 &&
    typeof magov2.frontal_image_id === "string" &&
    magov2.frontal_image_id.length > 0
  ) {
    result.push(
      {
        asset_id: magov2.reference_image_id,
        type: "element_reference",
        index: 0
      },
      { asset_id: magov2.frontal_image_id, type: "element_frontal", index: 0 }
    );
  }

  if (typeof magov2.image_id === "string" && magov2.image_id.length > 0) {
    result.push({ asset_id: magov2.image_id, type: "motion_reference" });
  }

  const referenceIds = magov2.image_ids ?? magov2.reference_image_ids;
  if (Array.isArray(referenceIds)) {
    referenceIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .forEach((asset_id) =>
        result.push({ asset_id, type: "reference_frame" })
      );
  }

  return result;
};

export const parseSourcesForFrontend = (
  data: BackendRenderData
): SourceImage[] => {
  const images = data.sources?.images;
  if (Array.isArray(images) && images.length > 0) {
    const validImages = images.filter(isValidImage);

    const hasLegacyCategory = validImages.some(
      (image) =>
        image.type === "reference_frame" && image.category !== undefined
    );
    const trimmed = hasLegacyCategory
      ? validImages.filter((image, index) => {
          if (image.type !== "reference_frame") return true;
          const firstReferenceIndex = validImages.findIndex(
            (e) => e.type === "reference_frame"
          );
          return index === firstReferenceIndex;
        })
      : validImages;

    const entries = trimmed.map((image) => {
      const entry: SourceImage = {
        asset_id: image.asset_id as string,
        type: image.type as SourceImage["type"]
      };
      if (INDEXED_ROLES.has(entry.type) && typeof image.index === "number") {
        entry.index = image.index;
      }
      return entry;
    });
    return dropReferenceFramesShadowedByKeyFrame(entries);
  }

  const legacySource = data.sources?.ipadapter_image_source;
  if (typeof legacySource === "string" && legacySource.length > 0) {
    return [{ asset_id: legacySource, type: "reference_frame" }];
  }

  const magov2 = data.render_settings?.magov2;
  if (magov2) {
    const legacySettingsSource = magov2.ipadapter_image_source;
    if (
      typeof legacySettingsSource === "string" &&
      legacySettingsSource.length > 0
    ) {
      return [{ asset_id: legacySettingsSource, type: "reference_frame" }];
    }

    const legacyImages = legacyImagesFromSettings(magov2);
    if (legacyImages.length > 0) return legacyImages;
  }

  return [];
};

export interface ParsedRenderData {
  renderSettings: VideoSettings;
  sources: SourceImage[];
  crop: NormalizedCropRect | undefined;
}

interface StoredCropFields {
  crop_coordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  source_video_dimensions?: [number, number];
}

export const parseRenderDataForFrontend = (
  data: BackendRenderData
): ParsedRenderData => {
  const magov2 = (data.render_settings?.magov2 ?? {}) as VideoSettings &
    StoredCropFields & {
      ipadapter_image_source?: string;
    };
  const crop = toNormalizedCropRectFromWireFields(magov2);
  const renderSettings: VideoSettings = { ...magov2 };
  delete (renderSettings as { ipadapter_image_source?: string })
    .ipadapter_image_source;
  delete (renderSettings as StoredCropFields).crop_coordinates;
  delete (renderSettings as StoredCropFields).source_video_dimensions;

  return {
    renderSettings,
    sources: parseSourcesForFrontend(data),
    crop
  };
};
