import { SheetGroup, SheetImage } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isSheetGroupRendering } from "./isSheetGroupRendering";

const sheetImage = (assetId: string, status: string): SheetImage => ({
  asset_id: assetId,
  clip_id: `clip-${assetId}`,
  name: assetId,
  status,
  source: "render" as const,
  url: null,
  thumbnail_url: null,
  created_at: null,
  has_description: false
});

const sheetGroup = (token: string, images: SheetImage[]): SheetGroup => ({
  token,
  name: token,
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: `layer-${token}`,
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images
});

describe("isSheetGroupRendering", () => {
  it("is true while this run covers the entity, before any clip exists", () => {
    expect(
      isSheetGroupRendering(sheetGroup("medic", []), new Set(["medic"]))
    ).toBe(true);
  });

  it("is true when a clip has not reached a terminal status", () => {
    expect(
      isSheetGroupRendering(
        sheetGroup("sergeant", [sheetImage("v2", "created")]),
        new Set()
      )
    ).toBe(true);
  });

  it("survives a page reload, because it reads the clip status too", () => {
    expect(
      isSheetGroupRendering(
        sheetGroup("sergeant", [sheetImage("v2", "IN_PROGRESS")]),
        new Set()
      )
    ).toBe(true);
  });

  it("is false when every clip has settled", () => {
    expect(
      isSheetGroupRendering(
        sheetGroup("sergeant", [
          sheetImage("v2", "success"),
          sheetImage("v1", "failed")
        ]),
        new Set()
      )
    ).toBe(false);
  });

  it("is false for an entity no run covers and no clip in flight", () => {
    expect(isSheetGroupRendering(sheetGroup("rifle", []), new Set())).toBe(
      false
    );
  });
});
