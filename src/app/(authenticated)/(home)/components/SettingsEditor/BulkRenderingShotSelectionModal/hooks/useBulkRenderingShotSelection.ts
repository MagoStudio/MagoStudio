import { bulkRenderingFlowAtom } from "@store/atoms";
import { useAtom } from "jotai";

export function useBulkRenderingShotSelection(allShotIds: string[]) {
  const [bulkRenderingFlow, setBulkRenderingFlow] = useAtom(
    bulkRenderingFlowAtom
  );

  const selectedShotIdsInFlow =
    bulkRenderingFlow?.view === "shotSelection"
      ? bulkRenderingFlow.selectedShotIds
      : new Set<string>();

  const setSelectedShotIds = (
    resolveNextSelectedShotIds: (
      currentSelectedShotIds: Set<string>
    ) => Set<string>
  ) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "shotSelection") return currentFlow;

      return {
        ...currentFlow,
        selectedShotIds: resolveNextSelectedShotIds(currentFlow.selectedShotIds)
      };
    });

  const selectedShotIds = new Set(
    allShotIds.filter((shotId) => selectedShotIdsInFlow.has(shotId))
  );

  const isShotSelected = (shotId: string) => selectedShotIds.has(shotId);

  const toggleShot = (shotId: string) => {
    setSelectedShotIds((currentSelectedShotIds) => {
      const nextSelectedShotIds = new Set(currentSelectedShotIds);
      if (nextSelectedShotIds.has(shotId)) {
        nextSelectedShotIds.delete(shotId);
      } else {
        nextSelectedShotIds.add(shotId);
      }
      return nextSelectedShotIds;
    });
  };

  const selectAll = () => setSelectedShotIds(() => new Set(allShotIds));

  const clearAll = () => setSelectedShotIds(() => new Set<string>());

  const areAllShotsSelected =
    allShotIds.length > 0 &&
    allShotIds.every((shotId) => selectedShotIds.has(shotId));

  return {
    selectedShotIds,
    isShotSelected,
    toggleShot,
    selectAll,
    clearAll,
    areAllShotsSelected,
    selectedCount: allShotIds.filter(isShotSelected).length
  };
}
