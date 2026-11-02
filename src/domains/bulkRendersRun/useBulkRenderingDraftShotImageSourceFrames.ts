import { bulkRenderingFlowAtom } from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotImageSourceFrameOverrides } from "./utils/buildBulkRenderingDraftShotImageSourceFrameOverrides";

export const DEFAULT_IMAGE_SOURCE_FRAME = 0;

export interface BulkRenderingDraftShotImageSourceFramesState {
  getImageSourceFrame: (shotId: string) => number;
  setImageSourceFrame: (shotId: string, frame: number) => void;
  hasAnyShotImageSourceFrameOverride: boolean;
  imageSourceFrameOverrideByShotId: Record<string, number>;
}

export const useBulkRenderingDraftShotImageSourceFrames = ({
  imageSourceFrameByShotId
}: {
  imageSourceFrameByShotId: Record<string, number>;
}): BulkRenderingDraftShotImageSourceFramesState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const getImageSourceFrame = (shotId: string) =>
    imageSourceFrameByShotId[shotId] ?? DEFAULT_IMAGE_SOURCE_FRAME;

  const setImageSourceFrame = (shotId: string, frame: number) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        imageSourceFrameByShotId: {
          ...currentFlow.imageSourceFrameByShotId,
          [shotId]: frame
        }
      };
    });

  const imageSourceFrameOverrideByShotId =
    buildBulkRenderingDraftShotImageSourceFrameOverrides({
      imageSourceFrameByShotId,
      defaultImageSourceFrame: DEFAULT_IMAGE_SOURCE_FRAME
    });

  return {
    getImageSourceFrame,
    setImageSourceFrame,
    hasAnyShotImageSourceFrameOverride:
      Object.keys(imageSourceFrameOverrideByShotId).length > 0,
    imageSourceFrameOverrideByShotId
  };
};
