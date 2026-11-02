import { SettingsGroup } from "@models/shared/types";

import { flattenSettingsGroups } from "./flattenSettingsGroups";

export const isAutoPromptAvailableForModel = (
  model: { settingsGroups: SettingsGroup[] } | undefined
): boolean => {
  if (!model) return false;

  const promptSetting = flattenSettingsGroups(model)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === "prompt");

  if (!promptSetting) return false;

  return !promptSetting.specificConfig?.hideAutoPrompt;
};
