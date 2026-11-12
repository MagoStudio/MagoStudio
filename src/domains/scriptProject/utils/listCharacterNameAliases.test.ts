import { describe, expect, it } from "vitest";

import { listCharacterNameAliases } from "./listCharacterNameAliases";

describe("listCharacterNameAliases", () => {
  it("lists the words of each alias, upper-cased", () => {
    expect(listCharacterNameAliases("HER / Emilia work clothes")).toEqual([
      ["HER"],
      ["EMILIA", "WORK", "CLOTHES"]
    ]);
  });

  it("ignores screenplay cue extensions and parentheses", () => {
    expect(listCharacterNameAliases("Emilia (V.O.)")).toEqual([["EMILIA"]]);
    expect(listCharacterNameAliases("EMILIA (COCKTAIL DRESS)")).toEqual([
      ["EMILIA"]
    ]);
  });

  it("drops an alias with no words", () => {
    expect(listCharacterNameAliases("(V.O.)")).toEqual([]);
  });
});
