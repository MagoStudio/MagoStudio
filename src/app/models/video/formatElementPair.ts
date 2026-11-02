import { SourceImage } from "@domains/renders/types";

import { ElementPair } from "./types";

export interface ElementPairAssetIds {
  referenceAssetId: string | undefined;
  frontalAssetId: string | undefined;
}

export const elementPairAssetIdsFromSources = (
  sources: SourceImage[]
): ElementPairAssetIds => ({
  referenceAssetId: sources.find((entry) => entry.type === "element_reference")
    ?.asset_id,
  frontalAssetId: sources.find((entry) => entry.type === "element_frontal")
    ?.asset_id
});

export const formatElementPairForBackend = (
  sources: SourceImage[]
): [ElementPair] | undefined => {
  const { referenceAssetId, frontalAssetId } =
    elementPairAssetIdsFromSources(sources);

  if (!referenceAssetId || !frontalAssetId) return undefined;
  return [
    { reference_image_id: [referenceAssetId], frontal_image_id: frontalAssetId }
  ];
};

export const formatElementPairForFrontend = (
  elements: unknown
): { reference_image_id?: string; frontal_image_id?: string } | null => {
  if (!Array.isArray(elements) || elements.length === 0) return null;

  const element = elements[0] as {
    reference_image_id?: string[] | string;
    frontal_image_id?: string;
  };

  const referenceImageId = Array.isArray(element.reference_image_id)
    ? element.reference_image_id[0]
    : element.reference_image_id;

  return {
    reference_image_id: referenceImageId,
    frontal_image_id: element.frontal_image_id
  };
};
