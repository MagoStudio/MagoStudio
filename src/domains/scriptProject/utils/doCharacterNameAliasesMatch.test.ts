import { describe, expect, it } from "vitest";

import { doCharacterNameAliasesMatch } from "./doCharacterNameAliasesMatch";

const words = (alias: string) => alias.split(" ");

describe("doCharacterNameAliasesMatch", () => {
  it.each([
    ["EMILIA", "EMILIA WORK CLOTHES"],
    ["ALEX SMITH", "ALEX"],
    ["ALEX SMITH", "ALEX SMITH"],
    ["TECH 2", "TECH 2"],
    ["TECH 2", "TECH 2 GLASSES"]
  ])("matches %s with %s", (speakerAlias, lookAlias) => {
    expect(
      doCharacterNameAliasesMatch(words(speakerAlias), words(lookAlias))
    ).toBe(true);
  });

  it.each([
    ["ALEX SMITH", "ALEX JONES"],
    ["EMILIA", "HER"],
    ["TECH", "TECH 2"],
    ["TECH 2", "TECH"],
    ["TECH 2", "TECH 3"],
    ["OFFICER JONES", "OFFICER JONES 2"],
    ["GUARD", "GUARD #2"]
  ])("does not match %s with %s", (speakerAlias, lookAlias) => {
    expect(
      doCharacterNameAliasesMatch(words(speakerAlias), words(lookAlias))
    ).toBe(false);
  });

  it("never matches an alias with no words", () => {
    expect(doCharacterNameAliasesMatch([], ["ALEX"])).toBe(false);
    expect(doCharacterNameAliasesMatch(["ALEX"], [])).toBe(false);
  });
});
