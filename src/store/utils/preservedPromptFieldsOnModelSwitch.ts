import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { doesModelDeclareSettingKey } from "@models/video/utils/doesModelDeclareSettingKey";

import { hasPreservableValue } from "./hasPreservableValue";

const PROMPT_FIELDS_PRESERVED_ON_MODEL_SWITCH = [
  "prompt",
  "negative_prompt"
] as const satisfies ReadonlyArray<keyof VideoSettings & string>;

export const preservedPromptFieldsOnModelSwitch = (
  newModel: VideoModelDefinition,
  previousValues: VideoSettings
): Partial<VideoSettings> => {
  const preservedValues: Partial<VideoSettings> = {};

  PROMPT_FIELDS_PRESERVED_ON_MODEL_SWITCH.forEach((field) => {
    const newModelOverwritesThisFieldOnSelect =
      field === "prompt" && newModel.capabilities.overwritesPromptOnSelect;
    if (newModelOverwritesThisFieldOnSelect) return;

    if (!doesModelDeclareSettingKey(newModel, field)) return;

    if (hasPreservableValue(previousValues[field])) {
      preservedValues[field] = previousValues[field];
    }
  });

  return preservedValues;
};
