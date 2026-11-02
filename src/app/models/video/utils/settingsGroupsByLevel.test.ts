import { SettingsGroup } from "@models/shared/types";
import { describe, expect, it } from "vitest";

import { settingsGroupsByLevel } from "./settingsGroupsByLevel";

const mainGroup: SettingsGroup = {
  name: "Main",
  level: "main",
  sections: [{ name: undefined, settings: [] }]
};

const technicalGroup: SettingsGroup = {
  name: "Technical",
  level: "technical",
  sections: [{ name: undefined, settings: [] }]
};

const advancedGroup: SettingsGroup = {
  name: "Advanced",
  level: "advanced",
  sections: [{ name: undefined, settings: [] }]
};

const teamOnlyGroup: SettingsGroup = {
  name: "Team only",
  level: "advanced",
  hidingCondition: (_settings, isTeamMember) => !isTeamMember,
  sections: [{ name: undefined, settings: [] }]
};

describe("settingsGroupsByLevel", () => {
  it("buckets groups per declared level", () => {
    const result = settingsGroupsByLevel(
      { settingsGroups: [mainGroup, technicalGroup, advancedGroup] },
      {},
      false
    );

    expect(result.main).toEqual([mainGroup]);
    expect(result.technical).toEqual([technicalGroup]);
    expect(result.advanced).toEqual([advancedGroup]);
  });

  it("returns an empty array for a level the model declares no group at", () => {
    const result = settingsGroupsByLevel(
      { settingsGroups: [mainGroup, advancedGroup] },
      {},
      false
    );

    expect(result.quality).toEqual([]);
    expect(result.technical).toEqual([]);
  });

  it("filters out a group whose hidingCondition matches", () => {
    const nonTeamMember = settingsGroupsByLevel(
      { settingsGroups: [mainGroup, teamOnlyGroup] },
      {},
      false
    );
    expect(nonTeamMember.advanced).toEqual([]);

    const teamMember = settingsGroupsByLevel(
      { settingsGroups: [mainGroup, teamOnlyGroup] },
      {},
      true
    );
    expect(teamMember.advanced).toEqual([teamOnlyGroup]);
  });
});
