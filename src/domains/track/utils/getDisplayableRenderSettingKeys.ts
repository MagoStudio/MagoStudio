import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { deriveImageSequenceExport } from "@models/video/utils/deriveImageSequenceExport";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

export const getDisplayableRenderSettingKeys = (params: {
  renderSettings?: VideoSettings;
  model?: VideoModelDefinition;
  isTeamMember?: boolean;
}): Partial<VideoSettings> => {
  const { renderSettings, model, isTeamMember } = params;
  const displayableSettings: Partial<VideoSettings> = {};

  if (!renderSettings || !model) return {};

  const settings = deriveImageSequenceExport(
    model.formatValuesForFrontend
      ? model.formatValuesForFrontend(renderSettings)
      : renderSettings
  );

  for (const section of flattenSettingsGroups(model)) {
    if (
      section.hidingCondition &&
      section.hidingCondition(settings, !!isTeamMember)
    ) {
      continue;
    }

    for (const setting of section.settings) {
      if (
        setting.hidingCondition &&
        setting.hidingCondition(settings, !!isTeamMember)
      ) {
        continue;
      }

      if (setting.key in settings) {
        displayableSettings[setting.key] = settings[setting.key];
      }

      if (setting.secondKey && setting.secondKey in settings) {
        displayableSettings[setting.secondKey] = settings[setting.secondKey];
      }
    }
  }

  return displayableSettings;
};
