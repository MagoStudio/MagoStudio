import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";

import { getAlwaysVisibleSettingKeys } from "./isAlwaysVisibleSetting";

export const preservedValuesOnPresetApply = (
  model: VideoModelDefinition,
  currentValues: VideoSettings,
  presetValues: Partial<VideoSettings>
): VideoSettings => {
  const modelDefaults = extractDefaultVideoSettings(model) as VideoSettings;
  const alwaysVisibleKeys = getAlwaysVisibleSettingKeys(model);

  const preservedBasicSettings: Partial<VideoSettings> = {};
  alwaysVisibleKeys.forEach((key) => {
    const typedKey = key as keyof VideoSettings;
    if (currentValues[typedKey] !== undefined) {
      preservedBasicSettings[typedKey] = currentValues[typedKey];
    }
  });

  return {
    ...modelDefaults,
    ...preservedBasicSettings,
    ...presetValues
  } as VideoSettings;
};
