import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import {
  groupSheetGroupsByDesignFamily,
  sheetGroupDesignLabel
} from "./groupSheetGroupsByDesignFamily";

const group = (token: string, name = "Mara", alt?: string): SheetGroup => ({
  token,
  name,
  alt,
  enabled: true,
  layer_id: token,
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: []
});

describe("groupSheetGroupsByDesignFamily", () => {
  it("groups a base design with every cast variant and keeps the base first", () => {
    const result = groupSheetGroupsByDesignFamily([
      group("mara--winter-coat", "Mara", "Winter coat"),
      group("mara"),
      group("mara--spacesuit", "Mara", "Spacesuit")
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        key: "mara",
        label: "Mara",
        hasVersions: true,
        groups: expect.arrayContaining([])
      })
    ]);
    expect(result[0].groups.map(({ token }) => token)).toEqual([
      "mara",
      "mara--spacesuit",
      "mara--winter-coat"
    ]);
  });

  it("leaves ordinary single slots flat and derives old cloud variant labels", () => {
    const [family] = groupSheetGroupsByDesignFamily([
      group("kitchen", "Kitchen")
    ]);
    expect(family.hasVersions).toBe(false);
    expect(sheetGroupDesignLabel(group("mara--winter-coat"))).toBe(
      "winter coat"
    );
  });

  it("uses the explicit master relation when collision deduping changed its token", () => {
    const master = { ...group("mara_2", "Mara"), is_design_master: true };
    const variant = {
      ...group("mara--winter", "Mara", "Winter"),
      master_token: "mara_2"
    };

    const [family] = groupSheetGroupsByDesignFamily([variant, master]);

    expect(family.key).toBe("mara_2");
    expect(family.groups.map(({ token }) => token)).toEqual([
      "mara_2",
      "mara--winter"
    ]);
  });
});
