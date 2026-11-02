import { Setting } from "@models/shared/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

const isStoredValueAbsentOrMatchingSettingType = (
  setting: Setting,
  value: unknown
): boolean => {
  if (value === undefined || value === null) return true;

  switch (setting.type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return (
        typeof value === "string" &&
        setting.options.some((option) => option.value === value)
      );
    case "array":
      return Array.isArray(value);
    case "tool":
      return true;
    default:
      return true;
  }
};

export const canRenderBulkRendersRunShotVideoSettings = (
  model: VideoModelDefinition,
  values: VideoSettings
): boolean => {
  const valuesByKey = values as Record<string, unknown>;

  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      if (
        !isStoredValueAbsentOrMatchingSettingType(
          setting,
          valuesByKey[setting.key]
        )
      ) {
        return false;
      }
      if (
        setting.secondKey &&
        !isStoredValueAbsentOrMatchingSettingType(
          setting,
          valuesByKey[setting.secondKey]
        )
      ) {
        return false;
      }
    }
  }

  return true;
};
