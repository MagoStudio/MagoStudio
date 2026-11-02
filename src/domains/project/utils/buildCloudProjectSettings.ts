import {
  ProjectSettingsMergeBase,
  mergeSettingsPatchWithCloudSettings
} from "./mergeSettingsPatchWithCloudSettings";

const LOCAL_ONLY_PROJECT_SETTINGS_KEYS = new Set(["origin", "cloudSummary"]);

const withoutLocalOnlyKeys = (
  settings: Record<string, unknown>
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(settings).filter(
      ([key]) => !LOCAL_ONLY_PROJECT_SETTINGS_KEYS.has(key)
    )
  );

export const buildCloudProjectSettings = (
  freshCloudSettings: Record<string, unknown> | undefined,
  settingsPatch: Record<string, unknown>,
  settingsMergeBase: ProjectSettingsMergeBase = {}
): Record<string, unknown> => {
  const cloudSettings = withoutLocalOnlyKeys(freshCloudSettings ?? {});
  return {
    ...cloudSettings,
    ...withoutLocalOnlyKeys(
      mergeSettingsPatchWithCloudSettings({
        freshCloudSettings: cloudSettings,
        settingsPatch,
        settingsMergeBase
      })
    )
  };
};
