import {
  isModelGroupAlwaysInstalled,
  type LocalModelGroupId,
  type LocalModelGroupInstallState
} from "../../../../../desktop/shared/localModelGroups";

export const resolveModelGroupSelection = ({
  groupId,
  state,
  userChoice
}: {
  groupId: LocalModelGroupId;
  state: LocalModelGroupInstallState;
  userChoice: boolean | undefined;
}): { isChecked: boolean; isLocked: boolean } => {
  const isLocked =
    isModelGroupAlwaysInstalled(groupId) || state === "installed";
  if (isLocked) return { isChecked: true, isLocked };
  return { isChecked: userChoice ?? state === "partial", isLocked };
};
