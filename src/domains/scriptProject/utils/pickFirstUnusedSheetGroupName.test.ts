import { describe, expect, it } from "vitest";

import { pickFirstUnusedSheetGroupName } from "./pickFirstUnusedSheetGroupName";

describe("pickFirstUnusedSheetGroupName", () => {
  it("keeps the name when no entity uses it", () => {
    expect(pickFirstUnusedSheetGroupName("New Character", ["hero"])).toBe(
      "New Character"
    );
  });

  it("numbers the name past every one already taken", () => {
    expect(
      pickFirstUnusedSheetGroupName("New Character", [
        "new_character",
        "new_character_2"
      ])
    ).toBe("New Character 3");
  });
});
