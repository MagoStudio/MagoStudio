import { bulkRenderingFlowAtom } from "@store/atoms";
import { useSetAtom } from "jotai";

export const useStartBulkRenderingFlow = () => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  return () => {
    setBulkRenderingFlow({
      view: "shotSelection",
      selectedShotIds: new Set<string>()
    });
  };
};
