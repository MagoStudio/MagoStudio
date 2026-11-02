import { SheetGroup, SheetImage } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isNewerSheetVersionAvailableThanPinned } from "./isNewerSheetVersionAvailableThanPinned";

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

const sheetGroup = (
  pinnedAssetId: string | null,
  images: SheetImage[]
): SheetGroup => ({
  token: "sergeant",
  name: "Sergeant",
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: "layer-1",
  layer_order: 0,
  selected_asset_id: pinnedAssetId,
  effective_asset_id: pinnedAssetId ?? images[0]?.asset_id ?? null,
  effective_source: null,
  images
});

describe("isNewerSheetVersionAvailableThanPinned", () => {
  it("badges a group whose newest successful version is not the pinned one", () => {
    const group = sheetGroup("v2", [
      sheetImage("v3", "success"),
      sheetImage("v2", "success")
    ]);

    expect(isNewerSheetVersionAvailableThanPinned(group)).toBe(true);
  });

  it("does not badge when the pin is already the newest successful version", () => {
    const group = sheetGroup("v3", [
      sheetImage("v3", "success"),
      sheetImage("v2", "success")
    ]);

    expect(isNewerSheetVersionAvailableThanPinned(group)).toBe(false);
  });

  it("does not call an older local version newer when images are oldest first", () => {
    const v1 = {
      ...sheetImage("v1", "available"),
      created_at: "2026-09-19T10:00:00.000Z"
    };
    const v2 = {
      ...sheetImage("v2", "available"),
      created_at: "2026-09-19T10:01:00.000Z"
    };

    expect(
      isNewerSheetVersionAvailableThanPinned(sheetGroup("v2", [v1, v2]))
    ).toBe(false);
  });

  it("ignores a render that has not succeeded yet", () => {
    const group = sheetGroup("v2", [
      sheetImage("v3", "created"),
      sheetImage("v2", "success")
    ]);

    expect(isNewerSheetVersionAvailableThanPinned(group)).toBe(false);
  });

  it("does not badge a group with a cleared pin, which already uses its newest", () => {
    const group = sheetGroup(null, [
      sheetImage("v3", "success"),
      sheetImage("v2", "success")
    ]);

    expect(isNewerSheetVersionAvailableThanPinned(group)).toBe(false);
  });

  it("does not badge a group with no successful version at all", () => {
    const group = sheetGroup("v1", [sheetImage("v1", "failed")]);

    expect(isNewerSheetVersionAvailableThanPinned(group)).toBe(false);
  });
});
