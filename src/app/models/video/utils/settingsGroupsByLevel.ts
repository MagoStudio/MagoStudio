import { SettingsGroup, SettingsLevel } from "@models/shared/types";

export type SettingsGroupsByLevel = Record<SettingsLevel, SettingsGroup[]>;

export const settingsGroupsByLevel = (
  model: { settingsGroups: SettingsGroup[] },
  values: Record<string, unknown>,
  isTeamMember: boolean
): SettingsGroupsByLevel => {
  const groupsByLevel: SettingsGroupsByLevel = {
    main: [],
    technical: [],
    quality: [],
    advanced: []
  };

  for (const group of model.settingsGroups) {
    if (group.hidingCondition?.(values, isTeamMember)) continue;
    groupsByLevel[group.level].push(group);
  }

  return groupsByLevel;
};
