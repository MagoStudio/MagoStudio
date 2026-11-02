import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildDraftShotReferenceChips } from "./buildDraftShotReferenceChips";

const buildImage = (assetId: string) => ({
  asset_id: assetId,
  name: `v-${assetId}`,
  url: `https://example.com/${assetId}.png`,
  thumbnail_url: `https://example.com/${assetId}-thumb.png`
});

const buildGroup = (overrides: Partial<SheetGroup>): SheetGroup =>
  ({
    token: "marie",
    name: "Marie",
    kind: "character",
    effective_asset_id: null,
    images: [],
    ...overrides
  }) as unknown as SheetGroup;

const noTags = { characters: [], environments: [], props: [] };

describe("buildDraftShotReferenceChips", () => {
  it("shows the Asset's effective image", () => {
    const [chip] = buildDraftShotReferenceChips(
      { ...noTags, characters: ["marie"] },
      [
        buildGroup({
          effective_asset_id: "b",
          images: [buildImage("a"), buildImage("b")]
        } as Partial<SheetGroup>)
      ]
    );

    expect(chip).toMatchObject({
      token: "marie",
      name: "Marie",
      category: "characters",
      assetId: "b",
      thumbnailUrl: "https://example.com/b-thumb.png",
      missingReason: null
    });
  });

  it("falls back to the first image when none is effective", () => {
    const [chip] = buildDraftShotReferenceChips(
      { ...noTags, characters: ["marie"] },
      [buildGroup({ images: [buildImage("a")] } as Partial<SheetGroup>)]
    );

    expect(chip?.assetId).toBe("a");
  });

  it("marks an Asset without images as missing one", () => {
    const [chip] = buildDraftShotReferenceChips(
      { ...noTags, props: ["lamp"] },
      []
    );

    expect(chip).toMatchObject({
      token: "lamp",
      name: "lamp",
      category: "props",
      assetId: null,
      missingReason: "no image"
    });
  });
});
