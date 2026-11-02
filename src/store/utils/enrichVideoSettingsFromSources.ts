import { SourceImage, SourceImageType } from "@domains/renders/types";
import { VideoSettings } from "@models/video/types";

export const SOURCE_MIRRORED_SETTING_KEYS = [
  "source_image_slot",
  "image_ids",
  "reference_image_id",
  "frontal_image_id"
] as const;

export const enrichVideoSettingsFromSources = (
  values: VideoSettings,
  sources: SourceImage[],
  sourceRolesFillingPrimarySlot: SourceImageType[]
): VideoSettings => {
  const primarySlotAssetId = sources.find((entry) =>
    sourceRolesFillingPrimarySlot.includes(entry.type)
  )?.asset_id;
  const referenceFrameAssetIds = sources
    .filter((entry) => entry.type === "reference_frame")
    .map((entry) => entry.asset_id);
  const elementReferenceAssetId = sources.find(
    (entry) => entry.type === "element_reference"
  )?.asset_id;
  const elementFrontalAssetId = sources.find(
    (entry) => entry.type === "element_frontal"
  )?.asset_id;

  const enriched: VideoSettings = {
    ...values,
    source_image_slot: primarySlotAssetId,
    image_ids: referenceFrameAssetIds,
    reference_image_id: elementReferenceAssetId,
    frontal_image_id: elementFrontalAssetId
  } as VideoSettings;

  if (enriched.skip_cnet_preprocess) {
    return { ...enriched, control_type: "depth" };
  }

  return enriched;
};
