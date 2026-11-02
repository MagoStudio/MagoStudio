import type { LocalModelGroupId } from "../../../../../desktop/shared/localModelGroups";

import { useLocalModelGroupsStatus } from "./useLocalModelGroupsStatus";

const MODEL_GROUPS_STATUS_REFETCH_MS = 5000;

export const useIsModelGroupInstalled = ({
  modelGroupId,
  isModelGroupCheckNeeded
}: {
  modelGroupId: LocalModelGroupId | null;
  isModelGroupCheckNeeded: boolean;
}): boolean => {
  const isStatusNeeded = isModelGroupCheckNeeded && modelGroupId !== null;
  const modelGroupsStatus = useLocalModelGroupsStatus({
    isLocalModelGroupsStatusNeeded: isStatusNeeded,
    refetchIntervalMs: MODEL_GROUPS_STATUS_REFETCH_MS
  });
  const status = modelGroupsStatus.data;
  if (!isStatusNeeded || !status || !status.isGetStartedInstall) return true;
  return (
    status.groups.find((group) => group.groupId === modelGroupId)?.state ===
    "installed"
  );
};
