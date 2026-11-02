import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

import { BulkRenderingShotSelectionModal } from "./BulkRenderingShotSelectionModal";

export const BulkRenderingShotSelectionModalHost: React.FC = () => {
  const bulkRenderingFlow = useAtomValue(bulkRenderingFlowAtom);
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const isShotSelectionModalOpen = bulkRenderingFlow?.view === "shotSelection";
  const isDraftOpen = bulkRenderingFlow?.view === "draft";
  const isBulkRenderingFlowOpen = isShotSelectionModalOpen || isDraftOpen;
  const selectedProjectId = useSelectedProjectId();
  const projectIdAtLastSelectionReset = useRef(selectedProjectId);

  // oxlint-disable-next-line custom-react/no-use-effect -- clears the Bulk Renders Run Shot selection when the Project changes while the flow is open, so a request can never carry one Project's id alongside another Project's Shot ids; syncing to an external URL-backed atom, not to a mount. Opening the flow resets it explicitly in useStartBulkRenderingFlow, not here.
  useEffect(() => {
    const hasProjectChanged =
      projectIdAtLastSelectionReset.current !== selectedProjectId;
    projectIdAtLastSelectionReset.current = selectedProjectId;
    if (!isBulkRenderingFlowOpen || !hasProjectChanged) return;

    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view === "shotSelection") {
        return { ...currentFlow, selectedShotIds: new Set<string>() };
      }
      if (currentFlow?.view === "draft") {
        return {
          ...currentFlow,
          selectedShotIds: new Set<string>(),
          uploadedFirstFrameAssetIdByShotId: {},
          imagePromptByShotId: {},
          videoPromptByShotId: {},
          imageModelByShotId: {},
          imageReferenceAssetIdsByShotId: {},
          videoSettingsByShotId: {},
          imageSettingByShotId: {}
        };
      }
      return currentFlow;
    });
  }, [isBulkRenderingFlowOpen, selectedProjectId, setBulkRenderingFlow]);

  if (!isShotSelectionModalOpen) return null;

  return <BulkRenderingShotSelectionModal />;
};
