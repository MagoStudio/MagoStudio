import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { partitionSheetGroupsByEnabled } from "./partitionSheetGroupsByEnabled";

const group = (token: string, enabled: boolean): SheetGroup =>
  ({ token, enabled }) as unknown as SheetGroup;

const tokensOf = (groups: SheetGroup[]) => groups.map((each) => each.token);

describe("partitionSheetGroupsByEnabled", () => {
  it("separates the entities a later cast dropped", () => {
    const { enabledGroups, disabledGroups } = partitionSheetGroupsByEnabled([
      group("d_artagnan", true),
      group("captain_finn", false),
      group("lila", false)
    ]);

    expect(tokensOf(enabledGroups)).toEqual(["d_artagnan"]);
    expect(tokensOf(disabledGroups)).toEqual(["captain_finn", "lila"]);
  });

  it("is empty both sides for a project with no entities", () => {
    const { enabledGroups, disabledGroups } = partitionSheetGroupsByEnabled([]);

    expect(enabledGroups).toEqual([]);
    expect(disabledGroups).toEqual([]);
  });
});
