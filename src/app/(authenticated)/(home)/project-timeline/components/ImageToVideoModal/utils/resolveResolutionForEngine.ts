import { VideoModelDefinition } from "@models/video/types";

const findResolutionSetting = (targetModel: VideoModelDefinition) => {
  for (const group of targetModel.settingsGroups) {
    for (const section of group.sections) {
      const resolutionSetting = section.settings.find(
        (setting) => setting.key === "resolution"
      );
      if (resolutionSetting?.type === "enum") return resolutionSetting;
    }
  }
  return undefined;
};

export const resolveResolutionForEngine = (
  currentResolution: string | undefined,
  targetModel: VideoModelDefinition
): string => {
  const resolutionSetting = findResolutionSetting(targetModel);
  const allowedResolutions =
    resolutionSetting?.options.map((option) => option.value) ?? [];

  if (currentResolution && allowedResolutions.includes(currentResolution)) {
    return currentResolution;
  }

  const modelDefaultResolution = resolutionSetting?.defaultValue;
  if (
    typeof modelDefaultResolution === "string" &&
    allowedResolutions.includes(modelDefaultResolution)
  ) {
    return modelDefaultResolution;
  }

  return allowedResolutions[0] ?? "";
};
