import { statfs } from "node:fs/promises";

import type { LocalModelGroupsStatus } from "../../shared/contracts";

import type { InspectedModelGroup } from "./inspectLocalModelGroups";
import { inspectLocalModelGroupsForInstall } from "./inspectLocalModelGroupsForInstall";

const missingBytesOf = (group: InspectedModelGroup) =>
  group.missingItems.reduce(
    (total, item) => total + (item.kind === "model-file" ? item.bytes : 0),
    0
  );

export const readLocalModelGroupsStatus = async (
  settings: Parameters<typeof inspectLocalModelGroupsForInstall>[0],
  readVideoMemoryBytes: () => Promise<number | null>
): Promise<LocalModelGroupsStatus> => {
  const { isGetStartedInstall, localModelsRoot, groups } =
    await inspectLocalModelGroupsForInstall(settings, readVideoMemoryBytes);
  const installRootFreeBytes = localModelsRoot
    ? await statfs(localModelsRoot)
        .then((space) => Number(space.bavail) * Number(space.bsize))
        .catch(() => null)
    : null;
  return {
    isGetStartedInstall,
    installRootFreeBytes,
    groups: groups.map((group) => ({
      groupId: group.groupId,
      state: group.state,
      missingBytes: missingBytesOf(group)
    }))
  };
};
