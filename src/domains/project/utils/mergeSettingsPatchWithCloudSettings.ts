import { Project } from "@schemas/project";

import { FolderTreeItem, mergeFolderTreeItems } from "./mergeFolderTreeItems";
import { mergePinnedTrackIds } from "./mergePinnedTrackIds";

export type ProjectSettingsMergeBase = Partial<
  Pick<Project["settings"], "pinnedTrackIds" | "folders" | "shotFolders">
>;

const readFolderTreeItems = (value: unknown): FolderTreeItem[] =>
  Array.isArray(value) ? value : [];

const readPinnedTrackIds = (value: unknown): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {};

type SettingsMergeInputs = {
  freshCloudSettings: Record<string, unknown>;
  settingsPatch: Record<string, unknown>;
  settingsMergeBase: ProjectSettingsMergeBase;
};

const mergePinnedTrackIdsKey = ({
  freshCloudSettings,
  settingsPatch,
  settingsMergeBase
}: SettingsMergeInputs): Record<string, unknown> => {
  const base = settingsMergeBase.pinnedTrackIds;
  if (!base || !("pinnedTrackIds" in settingsPatch)) return {};
  return {
    pinnedTrackIds: mergePinnedTrackIds({
      base,
      mine: readPinnedTrackIds(settingsPatch.pinnedTrackIds),
      theirs: readPinnedTrackIds(freshCloudSettings.pinnedTrackIds)
    })
  };
};

const mergeFolderTreeKey = (
  key: "folders" | "shotFolders",
  { freshCloudSettings, settingsPatch, settingsMergeBase }: SettingsMergeInputs
): Record<string, unknown> => {
  const base = settingsMergeBase[key];
  if (!base || !(key in settingsPatch)) return {};
  return {
    [key]: mergeFolderTreeItems({
      base,
      mine: readFolderTreeItems(settingsPatch[key]),
      theirs: readFolderTreeItems(freshCloudSettings[key])
    })
  };
};

export const mergeSettingsPatchWithCloudSettings = (
  mergeInputs: SettingsMergeInputs
): Record<string, unknown> => ({
  ...mergeInputs.settingsPatch,
  ...mergePinnedTrackIdsKey(mergeInputs),
  ...mergeFolderTreeKey("folders", mergeInputs),
  ...mergeFolderTreeKey("shotFolders", mergeInputs)
});
