import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveSheetGroupPreviewImage } from "./resolveSheetGroupPreviewImage";

const groupWith = (overrides: Partial<SheetGroup>): SheetGroup => ({
  token: "hero",
  name: "Hero",
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: "layer-1",
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: [],
  ...overrides
});

const imageWith = (
  assetId: string,
  thumbnailUrl: string | null,
  url: string | null
) => ({
  asset_id: assetId,
  clip_id: `clip-${assetId}`,
  name: null,
  status: "success",
  source: "render" as const,
  url,
  thumbnail_url: thumbnailUrl,
  created_at: null,
  has_description: false
});

describe("resolveSheetGroupPreviewImage", () => {
  it("has nothing to show when the group has no images", () => {
    expect(resolveSheetGroupPreviewImage(groupWith({}))).toBeUndefined();
  });

  it("prefers the image the group currently resolves to", () => {
    const group = groupWith({
      effective_asset_id: "asset-2",
      images: [
        imageWith("asset-1", "first-thumb.jpg", null),
        imageWith("asset-2", "second-thumb.jpg", null)
      ]
    });

    expect(resolveSheetGroupPreviewImage(group)).toBe("second-thumb.jpg");
  });

  it("falls back to the first image when none is effective", () => {
    const group = groupWith({
      images: [imageWith("asset-1", "first-thumb.jpg", null)]
    });

    expect(resolveSheetGroupPreviewImage(group)).toBe("first-thumb.jpg");
  });

  it("uses the full image when there is no thumbnail", () => {
    const group = groupWith({
      images: [imageWith("asset-1", null, "full.jpg")]
    });

    expect(resolveSheetGroupPreviewImage(group)).toBe("full.jpg");
  });
});
