import { SettingsGroup } from "@models/shared/types";
import { VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

const CONTROLNET_DETAIL_SECTIONS_NEVER_READ_TEAM_MEMBERSHIP = false;

export const applyControlnetDefaults = (
  model: { settingsGroups: SettingsGroup[] },
  values: VideoSettings,
  controlTypeValue: string
): VideoSettings => {
  const evaluationValues = { ...values, control_type: controlTypeValue };

  const matchingSections = flattenSettingsGroups(model).filter(
    (section) =>
      section.isControlNetDetailSetting &&
      section.hidingCondition &&
      !section.hidingCondition(
        evaluationValues,
        CONTROLNET_DETAIL_SECTIONS_NEVER_READ_TEAM_MEMBERSHIP
      )
  );

  return matchingSections.reduce((nextValues, section) => {
    return section.settings.reduce(
      (valuesWithDefaults, setting) => ({
        ...valuesWithDefaults,
        [setting.key]: setting.defaultValue
      }),
      nextValues
    );
  }, values);
};
