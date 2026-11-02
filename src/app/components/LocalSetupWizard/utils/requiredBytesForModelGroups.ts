import type { LocalModelGroupsStatus } from "../../../../../desktop/shared/contracts";
import type { LocalModelGroupId } from "../../../../../desktop/shared/localModelGroups";
import { starterEngineRequiredBytes } from "../../../../../desktop/shared/localModelManifest";

export const requiredBytesForModelGroups = ({
  modelGroupsStatus,
  checkedModelGroupIds
}: {
  modelGroupsStatus: LocalModelGroupsStatus;
  checkedModelGroupIds: LocalModelGroupId[];
}): number => {
  const engineBytes = modelGroupsStatus.isGetStartedInstall
    ? 0
    : starterEngineRequiredBytes();
  return modelGroupsStatus.groups
    .filter((group) => checkedModelGroupIds.includes(group.groupId))
    .reduce((total, group) => total + group.missingBytes, engineBytes);
};
