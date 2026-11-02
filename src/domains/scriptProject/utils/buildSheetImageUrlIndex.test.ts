import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildSheetImageUrlIndex } from "./buildSheetImageUrlIndex";

const group = (token: string, images: SheetGroup["images"]): SheetGroup => ({
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

const image = (
  assetId: string,
  url: string | null,
  thumbnailUrl: string | null
): SheetGroup["images"][number] => ({
  asset_id: assetId,
  clip_id: `clip-${assetId}`,
  name: assetId,
  status: "success",
  source: "render",
  url,
  thumbnail_url: thumbnailUrl,
  created_at: null,
  has_description: false
});

describe("buildSheetImageUrlIndex", () => {
  it("keeps the full image and the thumbnail apart, so zoom opens the full one", () => {
    const index = buildSheetImageUrlIndex([
      group("sergeant", [
        image(
          "a1",
          "https://example.test/full.png",
          "https://example.test/thumb.png"
        )
      ])
    ]);

    expect(index.get("a1")).toEqual({
      url: "https://example.test/full.png",
      thumbnailUrl: "https://example.test/thumb.png"
    });
  });

  it("indexes across every group", () => {
    const index = buildSheetImageUrlIndex([
      group("sergeant", [image("a1", "full-1", "thumb-1")]),
      group("colony", [image("b1", "full-2", "thumb-2")])
    ]);

    expect(index.size).toBe(2);
    expect(index.get("b1")?.url).toBe("full-2");
  });

  it("carries an in-flight version with no URLs yet, rather than dropping it", () => {
    const index = buildSheetImageUrlIndex([
      group("sergeant", [image("a1", null, null)])
    ]);

    expect(index.get("a1")).toEqual({
      url: undefined,
      thumbnailUrl: undefined
    });
  });

  it("is empty for a cast with no images", () => {
    expect(buildSheetImageUrlIndex([group("medic", [])]).size).toBe(0);
  });
});
