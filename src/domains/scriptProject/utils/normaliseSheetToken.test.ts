import { describe, expect, it } from "vitest";

import { normaliseSheetToken } from "./normaliseSheetToken";

describe("normaliseSheetToken", () => {
  it("lowercases, so one entity cannot become two groups", () => {
    expect(normaliseSheetToken("Sergeant")).toBe("sergeant");
  });

  it("replaces every run of other characters with a single underscore", () => {
    expect(normaliseSheetToken("Sergeant Kovac")).toBe("sergeant_kovac");
    expect(normaliseSheetToken("Gauss  Rifle!!")).toBe("gauss_rifle");
  });

  it("trims the underscores the replacement leaves at the edges", () => {
    expect(normaliseSheetToken("  'Medic'  ")).toBe("medic");
  });

  it("keeps digits and underscores", () => {
    expect(normaliseSheetToken("terran_colony_2")).toBe("terran_colony_2");
  });

  it("is null when nothing usable is left, which the backend rejects", () => {
    expect(normaliseSheetToken("")).toBeNull();
    expect(normaliseSheetToken("   ")).toBeNull();
    expect(normaliseSheetToken("!!!")).toBeNull();
  });

  it("caps the length the backend caps", () => {
    expect(normaliseSheetToken("a".repeat(250))).toHaveLength(200);
  });
});
