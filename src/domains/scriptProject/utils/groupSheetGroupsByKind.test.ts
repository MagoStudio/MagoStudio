import { SheetGroup, SheetKind } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { groupSheetGroupsByKind } from "./groupSheetGroupsByKind";

const sheetGroup = (
  token: string,
  kind: SheetKind | null,
  layerOrder: number
): SheetGroup => ({
  token,
  name: token,
  kind,
  description: null,
  prompt: null,
  enabled: true,
  layer_id: `layer-${token}`,
  layer_order: layerOrder,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: []
});

describe("groupSheetGroupsByKind", () => {
  it("sections rows as characters, then environments, then props", () => {
    const sections = groupSheetGroupsByKind([
      sheetGroup("rifle", "prop", 0),
      sheetGroup("colony", "environment", 1),
      sheetGroup("sergeant", "character", 2)
    ]);

    expect(sections.map((section) => section.kind)).toEqual([
      "character",
      "environment",
      "prop"
    ]);
  });

  it("keeps the order the backend gave inside a section", () => {
    const sections = groupSheetGroupsByKind([
      sheetGroup("sergeant", "character", 0),
      sheetGroup("medic", "character", 1)
    ]);

    expect(sections[0]?.groups.map((group) => group.token)).toEqual([
      "sergeant",
      "medic"
    ]);
  });

  it("omits a section with no rows", () => {
    const sections = groupSheetGroupsByKind([
      sheetGroup("sergeant", "character", 0)
    ]);

    expect(sections).toHaveLength(1);
  });

  it("keeps a group whose kind the backend did not set, in a trailing section", () => {
    const sections = groupSheetGroupsByKind([
      sheetGroup("sergeant", "character", 0),
      sheetGroup("mystery", null, 1)
    ]);

    expect(sections.map((section) => section.kind)).toEqual([
      "character",
      null
    ]);
    expect(sections[1]?.groups.map((group) => group.token)).toEqual([
      "mystery"
    ]);
  });
});
