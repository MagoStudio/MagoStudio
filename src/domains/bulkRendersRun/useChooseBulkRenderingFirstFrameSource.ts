import {
  BulkRenderingFirstFrameSource,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

export const useChooseBulkRenderingFirstFrameSource = () => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  return (firstFrameSource: BulkRenderingFirstFrameSource) => {
    setBulkRenderingFlow((currentFlow) => {
      if (
        currentFlow?.view !== "draft" ||
        currentFlow.firstFrameSource !== undefined
      ) {
        return currentFlow;
      }

      return { ...currentFlow, firstFrameSource };
    });
  };
};
