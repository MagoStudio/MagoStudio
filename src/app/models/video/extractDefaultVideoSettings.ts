import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

export const extractDefaultVideoSettings = (
  model?: VideoModelDefinition,
  isTeamMember?: boolean
): VideoSettings => {
  if (!model) return {};

  const sections = flattenSettingsGroups(model);

  const defaultValues: VideoSettings = {
    input_image: undefined,
    mago_engine: model.name
  };

  for (const section of sections) {
    for (const setting of section.settings) {
      defaultValues[setting.key] = setting.defaultValue;
      if (setting.secondKey) {
        defaultValues[setting.secondKey] = setting.secondDefaultValue;
      }
    }
  }

  const conditionalDefaults: VideoSettings = {};
  for (const section of sections) {
    if (
      section.hidingCondition &&
      section.hidingCondition(defaultValues, isTeamMember ?? false)
    ) {
      continue;
    }

    for (const setting of section.settings) {
      if (
        setting.hidingCondition &&
        setting.hidingCondition(defaultValues, isTeamMember ?? false)
      ) {
        continue;
      }

      conditionalDefaults[setting.key] = setting.defaultValue;
      if (setting.secondKey) {
        conditionalDefaults[setting.secondKey] = setting.secondDefaultValue;
      }
    }
  }

  return { ...defaultValues, ...conditionalDefaults, ...model.extraKeys };
};
