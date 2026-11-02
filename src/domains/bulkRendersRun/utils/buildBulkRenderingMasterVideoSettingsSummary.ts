import { SettingsSection } from "@models/shared/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

const EXCLUDED_SETTING_KEYS = new Set(["prompt", "negative_prompt"]);

export interface BulkRenderingMasterVideoSettingsSummaryEntry {
  key: string;
  label: string;
  value: string;
}

const formatSettingValue = (
  section: SettingsSection,
  key: string,
  value: unknown
): string => {
  const setting = section.settings.find((candidate) => candidate.key === key);
  if (setting?.type === "enum") {
    const matchedOption = setting.options.find(
      (option) => option.value === value
    );
    if (matchedOption) return matchedOption.label;
  }
  return String(value);
};

export const buildBulkRenderingMasterVideoSettingsSummary = ({
  videoModel,
  videoSettings,
  isTeamMember
}: {
  videoModel: VideoModelDefinition;
  videoSettings: VideoSettings;
  isTeamMember: boolean;
}): BulkRenderingMasterVideoSettingsSummaryEntry[] => {
  const entries: BulkRenderingMasterVideoSettingsSummaryEntry[] = [];

  for (const section of flattenSettingsGroups(videoModel)) {
    if (section.hidingCondition?.(videoSettings, isTeamMember)) {
      continue;
    }

    for (const setting of section.settings) {
      if (EXCLUDED_SETTING_KEYS.has(setting.key)) continue;
      if (setting.hidingCondition?.(videoSettings, isTeamMember)) {
        continue;
      }

      const value = videoSettings[setting.key];
      if (value === undefined) continue;

      entries.push({
        key: setting.key,
        label: setting.label,
        value: formatSettingValue(section, setting.key, value)
      });
    }
  }

  return entries;
};
