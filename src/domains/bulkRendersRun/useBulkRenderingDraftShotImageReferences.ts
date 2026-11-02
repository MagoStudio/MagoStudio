import {
  BulkRendersRunDraftMasterSettings,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotImageReferenceOverrides } from "./utils/buildBulkRenderingDraftShotImageReferenceOverrides";

export interface BulkRenderingDraftShotImageReferencesState {
  defaultImageReferenceAssetIds: string[];
  getImageReferenceAssetIds: (shotId: string) => string[];
  setImageReferenceAssetIds: (shotId: string, assetIds: string[]) => void;
  hasAnyShotImageReferenceOverride: boolean;
  imageReferenceAssetIdsOverrideByShotId: Record<string, string[]>;
}

export const useBulkRenderingDraftShotImageReferences = ({
  masterSettings,
  imageReferenceAssetIdsByShotId
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  imageReferenceAssetIdsByShotId: Record<string, string[]>;
}): BulkRenderingDraftShotImageReferencesState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const defaultImageReferenceAssetIds =
    masterSettings.imageSettings.referenceImages;

  const getImageReferenceAssetIds = (shotId: string) =>
    imageReferenceAssetIdsByShotId[shotId] ?? defaultImageReferenceAssetIds;

  const setImageReferenceAssetIds = (shotId: string, assetIds: string[]) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        imageReferenceAssetIdsByShotId: {
          ...currentFlow.imageReferenceAssetIdsByShotId,
          [shotId]: assetIds
        }
      };
    });

  const imageReferenceAssetIdsOverrideByShotId =
    buildBulkRenderingDraftShotImageReferenceOverrides({
      imageReferenceAssetIdsByShotId,
      defaultImageReferenceAssetIds
    });

  return {
    defaultImageReferenceAssetIds,
    getImageReferenceAssetIds,
    setImageReferenceAssetIds,
    hasAnyShotImageReferenceOverride:
      Object.keys(imageReferenceAssetIdsOverrideByShotId).length > 0,
    imageReferenceAssetIdsOverrideByShotId
  };
};
