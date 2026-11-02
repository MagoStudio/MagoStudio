import { VideoModelDefinition } from "@models/video/types";

const VIDEO_SETTING_KEYS_DECLARED_OUTSIDE_SETTINGS_GROUPS = ["prompt"] as const;

export const getDeclaredVideoSettingKeysForModel = (
  model: VideoModelDefinition
): Set<string> => {
  const declaredKeys = new Set<string>(
    VIDEO_SETTING_KEYS_DECLARED_OUTSIDE_SETTINGS_GROUPS
  );

  for (const group of model.settingsGroups ?? []) {
    for (const section of group.sections) {
      for (const setting of section.settings) {
        declaredKeys.add(setting.key);
        if (setting.secondKey) declaredKeys.add(setting.secondKey);
      }
    }
  }

  return declaredKeys;
};
