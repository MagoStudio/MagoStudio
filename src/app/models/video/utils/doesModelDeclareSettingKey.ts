import { VideoModelDefinition } from "@models/video/types";

import { flattenSettingsGroups } from "./flattenSettingsGroups";

export const doesModelDeclareSettingKey = (
  model: VideoModelDefinition,
  key: string
): boolean => {
  if (model.extraKeys && key in model.extraKeys) return true;
  if (!model.settingsGroups) return false;

  return flattenSettingsGroups(model).some((section) =>
    section.settings.some((setting) => setting.key === key)
  );
};
