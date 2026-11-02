import { Setting } from "@models/shared/types";
import { RENDER_MODELS } from "@models/video/constants";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

export const getSettingLabel = (key: string, engineName: string): string => {
  const model = RENDER_MODELS.find((model) => model.name === engineName);

  if (!model) {
    return key;
  }

  for (const section of flattenSettingsGroups(model)) {
    const setting = section.settings.find(
      (s: Setting) => s.key === key || s.secondKey === key
    );
    if (setting) {
      return setting.label;
    }
  }

  if (key === "mago_engine") {
    return "Model";
  }

  return key;
};
