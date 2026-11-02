import type { LocalModelGroupInstallState } from "../../shared/localModelGroups";

import type { ModelGroupItem } from "./listModelGroupItems";

export const resolveModelGroupInstallState = ({
  items,
  recordedItemSha256s,
  presentItems
}: {
  items: ModelGroupItem[];
  recordedItemSha256s: string[] | undefined;
  presentItems: Set<ModelGroupItem>;
}): {
  state: LocalModelGroupInstallState;
  missingItems: ModelGroupItem[];
  shouldRecordAsInstalled: boolean;
} => {
  if (recordedItemSha256s === undefined) {
    const missingItems = items.filter((item) => !presentItems.has(item));
    if (missingItems.length === 0)
      return {
        state: "installed",
        missingItems,
        shouldRecordAsInstalled: true
      };
    const hasAnyModelFileOnDisk = items.some(
      (item) => item.kind === "model-file" && presentItems.has(item)
    );
    return {
      state: hasAnyModelFileOnDisk ? "partial" : "not-installed",
      missingItems,
      shouldRecordAsInstalled: false
    };
  }
  const recorded = new Set(recordedItemSha256s);
  const missingItems = items.filter(
    (item) => !recorded.has(item.sha256) || !presentItems.has(item)
  );
  return {
    state: missingItems.length === 0 ? "installed" : "partial",
    missingItems,
    shouldRecordAsInstalled: false
  };
};
