import { stat } from "node:fs/promises";

import {
  LOCAL_MODEL_GROUP_IDS,
  type LocalModelGroupId,
  type LocalModelGroupInstallState,
  type SelectedModelGroupVariants
} from "../../shared/localModelGroups";
import type { LibrarySettings } from "../librarySettings";

import {
  listModelGroupItems,
  type ModelGroupItem
} from "./listModelGroupItems";
import { readRunningComfyAvailability } from "./readRunningComfyAvailability";
import { resolveModelGroupInstallState } from "./resolveModelGroupInstallState";
import { resolveStarterEnginePaths } from "./resolveStarterEnginePaths";

export type InspectedModelGroup = {
  groupId: LocalModelGroupId;
  state: LocalModelGroupInstallState;
  items: ModelGroupItem[];
  missingItems: ModelGroupItem[];
};

export const isModelGroupItemOnDisk = async (
  item: ModelGroupItem
): Promise<boolean> => {
  const info = await stat(item.absolutePath).catch(() => null);
  if (!info) return false;
  return item.kind === "node-pack"
    ? info.isDirectory()
    : info.isFile() && info.size === item.bytes;
};

export const inspectLocalModelGroups = async (
  settings: Pick<
    LibrarySettings,
    | "getLocalModelsRoot"
    | "getSelectedModelGroupVariants"
    | "getInstalledModelGroups"
    | "recordInstalledModelGroup"
  > &
    Partial<Pick<LibrarySettings, "getComfyEndpoint">>,
  selectedModelGroupVariantsOverride?: SelectedModelGroupVariants
): Promise<{
  isGetStartedInstall: boolean;
  localModelsRoot: string | null;
  groups: InspectedModelGroup[];
}> => {
  const localModelsRoot = await settings.getLocalModelsRoot();
  const selectedModelGroupVariants =
    selectedModelGroupVariantsOverride ??
    (await settings.getSelectedModelGroupVariants());
  const isGetStartedInstall =
    localModelsRoot !== null &&
    (await stat(resolveStarterEnginePaths(localModelsRoot).engineMarker)
      .then((info) => info.isFile())
      .catch(() => false));
  const installedModelGroups = await settings.getInstalledModelGroups();
  const runningAvailability = settings.getComfyEndpoint
    ? await readRunningComfyAvailability(await settings.getComfyEndpoint())
    : null;
  const groups = await Promise.all(
    LOCAL_MODEL_GROUP_IDS.map(async (groupId) => {
      const items = listModelGroupItems({
        groupId,
        selectedModelGroupVariants,
        localModelsRoot: localModelsRoot ?? ""
      });
      const presentItems = new Set<ModelGroupItem>();
      if (runningAvailability)
        for (const item of items) {
          if (runningAvailability(item)) presentItems.add(item);
        }
      else if (isGetStartedInstall)
        for (const item of items)
          if (await isModelGroupItemOnDisk(item)) presentItems.add(item);
      const resolved = resolveModelGroupInstallState({
        items,
        recordedItemSha256s: runningAvailability
          ? undefined
          : installedModelGroups[groupId],
        presentItems
      });
      const isInspectingSavedModelGroupVariants =
        selectedModelGroupVariantsOverride === undefined;
      if (
        resolved.shouldRecordAsInstalled &&
        !runningAvailability &&
        isInspectingSavedModelGroupVariants
      )
        await settings.recordInstalledModelGroup(
          groupId,
          items.map((item) => item.sha256)
        );
      return {
        groupId,
        state: resolved.state,
        items,
        missingItems: resolved.missingItems
      };
    })
  );
  return { isGetStartedInstall, localModelsRoot, groups };
};
