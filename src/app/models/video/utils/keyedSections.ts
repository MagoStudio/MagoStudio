import { SettingsGroup, SettingsSection } from "@models/shared/types";

export interface KeyedSection {
  key: string;
  section: SettingsSection;
}

export const keyedSections = (groups: SettingsGroup[]): KeyedSection[] =>
  groups.flatMap((group, groupIndex) =>
    group.sections.map((section, sectionIndex) => ({
      key: `${group.level}-${groupIndex}-${sectionIndex}`,
      section
    }))
  );
