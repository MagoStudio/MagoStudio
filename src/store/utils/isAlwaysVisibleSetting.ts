import { VideoModelDefinition } from "@models/video/types";

const ALWAYS_VISIBLE_LEVELS = new Set(["main", "technical"]);

export const getAlwaysVisibleSettingKeys = (
  model: VideoModelDefinition
): Set<string> => {
  const keys = new Set<string>();

  for (const group of model.settingsGroups) {
    if (!ALWAYS_VISIBLE_LEVELS.has(group.level)) continue;

    for (const section of group.sections) {
      for (const setting of section.settings) {
        keys.add(setting.key);
        if (setting.secondKey) {
          keys.add(setting.secondKey);
        }
      }
    }
  }

  return keys;
};

export const isAlwaysVisibleSetting = (
  key: string,
  model: VideoModelDefinition
): boolean => {
  return getAlwaysVisibleSettingKeys(model).has(key);
};
