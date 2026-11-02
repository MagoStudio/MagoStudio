import { SheetGroup, SheetImage } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import {
  findNewestSuccessfulSheetImage,
  isSheetImageSuccessful
} from "./findNewestSuccessfulSheetImage";

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

const sheetGroupWithImages = (images: SheetImage[]): SheetGroup => ({
  token: "sergeant",
  name: "Sergeant",
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: "layer-1",
  layer_order: 0,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images
});

describe("findNewestSuccessfulSheetImage", () => {
  it("takes the first successful image, since the backend returns newest first", () => {
    const image = findNewestSuccessfulSheetImage(
      sheetGroupWithImages([
        sheetImage("v3", "success"),
        sheetImage("v2", "success")
      ])
    );

    expect(image?.asset_id).toBe("v3");
  });

  it("uses creation time for local snapshots stored oldest first", () => {
    const older = {
      ...sheetImage("v1", "available"),
      created_at: "2026-09-19T10:00:00.000Z"
    };
    const newer = {
      ...sheetImage("v2", "available"),
      created_at: "2026-09-19T10:01:00.000Z"
    };

    expect(
      findNewestSuccessfulSheetImage(sheetGroupWithImages([older, newer]))
        ?.asset_id
    ).toBe("v2");
  });

  it("skips a render still in flight", () => {
    const image = findNewestSuccessfulSheetImage(
      sheetGroupWithImages([
        sheetImage("v3", "created"),
        sheetImage("v2", "success")
      ])
    );

    expect(image?.asset_id).toBe("v2");
  });

  it("is undefined when nothing has succeeded", () => {
    expect(
      findNewestSuccessfulSheetImage(
        sheetGroupWithImages([sheetImage("v1", "failed")])
      )
    ).toBeUndefined();
  });

  it("is undefined for a group with no renders", () => {
    expect(
      findNewestSuccessfulSheetImage(sheetGroupWithImages([]))
    ).toBeUndefined();
  });

  it.each(["success", "SUCCESS", "available", "AVAILABLE"])(
    "accepts %s as complete",
    (status) =>
      expect(isSheetImageSuccessful(sheetImage("asset", status))).toBe(true)
  );

  it("finds an existing locally persisted available image", () => {
    const available = sheetImage("local-asset", "available");
    const group = sheetGroupWithImages([
      sheetImage("pending", "pending"),
      available
    ]);

    expect(findNewestSuccessfulSheetImage(group)).toBe(available);
  });
});
