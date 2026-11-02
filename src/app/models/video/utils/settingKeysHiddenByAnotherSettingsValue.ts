import { VideoModelDefinition, VideoSettings } from "@models/video/types";

import { extractDefaultVideoSettings } from "../extractDefaultVideoSettings";

import { flattenSettingsGroups } from "./flattenSettingsGroups";

const IGNORE_MEMBERSHIP_SO_ONLY_VALUES_DECIDE = true;

type HidingCondition = (
  settings: VideoSettings,
  isTeamMember: boolean
) => boolean;

const isHiddenFor = (
  hidingCondition: HidingCondition | undefined,
  values: VideoSettings
): boolean =>
  hidingCondition !== undefined &&
  hidingCondition(values, IGNORE_MEMBERSHIP_SO_ONLY_VALUES_DECIDE);

const settingKeysVisibleFor = (
  model: VideoModelDefinition,
  values: VideoSettings
): Set<string> => {
  const visibleKeys = new Set<string>();

  for (const section of flattenSettingsGroups(model)) {
    if (isHiddenFor(section.hidingCondition, values)) continue;

    for (const setting of section.settings) {
      if (isHiddenFor(setting.hidingCondition, values)) continue;

      visibleKeys.add(setting.key);
      if (setting.secondKey) visibleKeys.add(setting.secondKey);
    }
  }

  return visibleKeys;
};

export const settingKeysHiddenByAnotherSettingsValue = (
  model: VideoModelDefinition,
  settings: VideoSettings
): string[] => {
  const defaults = extractDefaultVideoSettings(
    model,
    IGNORE_MEMBERSHIP_SO_ONLY_VALUES_DECIDE
  );

  const visibleNow = settingKeysVisibleFor(model, {
    ...defaults,
    ...settings
  });

  return [...settingKeysVisibleFor(model, defaults)].filter(
    (key) => !visibleNow.has(key)
  );
};
