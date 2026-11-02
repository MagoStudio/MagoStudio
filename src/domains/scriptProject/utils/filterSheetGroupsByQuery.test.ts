import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { filterSheetGroupsByQuery } from "./filterSheetGroupsByQuery";

const sheetGroup = (token: string, name: string): SheetGroup => ({
  token,
  name,
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: `layer-${token}`,
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: []
});

const groups = [
  sheetGroup("sergeant", "Sergeant Kovac"),
  sheetGroup("terran_colony", "Terran Colony"),
  sheetGroup("medic", "Medic")
];

describe("filterSheetGroupsByQuery", () => {
  it("returns every group for an empty query", () => {
    expect(filterSheetGroupsByQuery(groups, "")).toHaveLength(3);
    expect(filterSheetGroupsByQuery(groups, "   ")).toHaveLength(3);
  });

  it("matches the display name, ignoring case", () => {
    const found = filterSheetGroupsByQuery(groups, "kovac");
    expect(found.map((group) => group.token)).toEqual(["sergeant"]);
  });

  it("matches the token, which is what the shot tags speak", () => {
    const found = filterSheetGroupsByQuery(groups, "terran_colony");
    expect(found.map((group) => group.token)).toEqual(["terran_colony"]);
  });

  it("matches a partial word anywhere in the name", () => {
    const found = filterSheetGroupsByQuery(groups, "colony");
    expect(found.map((group) => group.token)).toEqual(["terran_colony"]);
  });

  it("returns nothing when no group matches", () => {
    expect(filterSheetGroupsByQuery(groups, "rifle")).toEqual([]);
  });

  it("keeps the order the backend gave", () => {
    const found = filterSheetGroupsByQuery(groups, "e");
    expect(found.map((group) => group.token)).toEqual([
      "sergeant",
      "terran_colony",
      "medic"
    ]);
  });
});
