import { SettingsGroup, SettingsSection } from "@models/shared/types";

export const flattenSettingsGroups = (model: {
  settingsGroups: SettingsGroup[];
}): SettingsSection[] =>
  model.settingsGroups.flatMap((group) => group.sections);
