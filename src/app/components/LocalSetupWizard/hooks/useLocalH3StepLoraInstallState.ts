import { useQuery } from "@tanstack/react-query";

import {
  MINIMAX_H3_STEP_LORAS,
  type MiniMaxH3StepLoraSteps
} from "../../../../../desktop/shared/minimaxH3StepLoras";

import { useLocalModelGroupsStatus } from "./useLocalModelGroupsStatus";

const INSTALL_STATE_REFETCH_MS = 5000;

export const useLocalH3StepLoraInstallState = (isLocalProject: boolean) => {
  const modelGroupsStatus = useLocalModelGroupsStatus({
    isLocalModelGroupsStatusNeeded: isLocalProject,
    refetchIntervalMs: INSTALL_STATE_REFETCH_MS
  });
  const scriptSetup = useQuery({
    queryKey: ["local-script-setup"],
    queryFn: () => window.mago.comfy.scriptSetupStatus(),
    enabled: isLocalProject,
    retry: false,
    refetchInterval: INSTALL_STATE_REFETCH_MS
  });

  const isStepLoraModelGroupInstalled = (steps: MiniMaxH3StepLoraSteps) => {
    const status = modelGroupsStatus.data;
    if (!isLocalProject || !status || !status.isGetStartedInstall) return true;
    return (
      status.groups.find(
        (group) => group.groupId === MINIMAX_H3_STEP_LORAS[steps].modelGroupId
      )?.state === "installed"
    );
  };

  const isStepLoraMissingFromComfy = (steps: MiniMaxH3StepLoraSteps) =>
    [
      ...(scriptSetup.data?.models ?? []),
      ...(scriptSetup.data?.optionalStepLoras ?? [])
    ].some(
      (item) =>
        item.name === MINIMAX_H3_STEP_LORAS[steps].loraFile &&
        item.status === "missing"
    );

  const isStepLoraInstalled = (steps: MiniMaxH3StepLoraSteps) =>
    isStepLoraModelGroupInstalled(steps) && !isStepLoraMissingFromComfy(steps);

  return { isStepLoraModelGroupInstalled, isStepLoraInstalled };
};
