import {
  BulkRenderingFirstFrameSource,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

export interface BulkRenderingDraftFirstFrameSourceState {
  firstFrameSource: BulkRenderingFirstFrameSource | undefined;
  isFirstFrameSupplied: boolean;
  uploadedFirstFrameAssetIdByShotId: Record<string, string>;
  getUploadedFirstFrameAssetId: (shotId: string) => string | undefined;
  setUploadedFirstFrameAssetId: (shotId: string, assetId: string) => void;
}

export const useBulkRenderingDraftFirstFrameSource = ({
  firstFrameSource,
  uploadedFirstFrameAssetIdByShotId
}: {
  firstFrameSource: BulkRenderingFirstFrameSource | undefined;
  uploadedFirstFrameAssetIdByShotId: Record<string, string>;
}): BulkRenderingDraftFirstFrameSourceState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const getUploadedFirstFrameAssetId = (shotId: string) =>
    uploadedFirstFrameAssetIdByShotId[shotId];

  const setUploadedFirstFrameAssetId = (shotId: string, assetId: string) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        uploadedFirstFrameAssetIdByShotId: {
          ...currentFlow.uploadedFirstFrameAssetIdByShotId,
          [shotId]: assetId
        }
      };
    });

  return {
    firstFrameSource,
    isFirstFrameSupplied: firstFrameSource === "uploaded",
    uploadedFirstFrameAssetIdByShotId,
    getUploadedFirstFrameAssetId,
    setUploadedFirstFrameAssetId
  };
};
