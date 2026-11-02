import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { listSceneReferenceImages } from "./listSceneReferenceImages";

const sheetGroup = (
  token: string,
  effectiveAssetId: string | null
): SheetGroup =>
  ({
    token,
    name: token[0]!.toUpperCase() + token.slice(1),
    effective_asset_id: effectiveAssetId
  }) as SheetGroup;

const sheetGroups = [
  sheetGroup("maya", "asset-maya"),
  sheetGroup("leo", "asset-leo"),
  sheetGroup("ghost", null),
  sheetGroup("kitchen", "asset-kitchen"),
  sheetGroup("note", "asset-note"),
  sheetGroup("storyboard_scene_1", "asset-storyboard")
];

const tags = {
  characters: ["maya", "ghost", "leo"],
  environments: ["kitchen"],
  props: ["note", "storyboard_scene_1"]
};

describe("listSceneReferenceImages", () => {
  it("lists only the characters' pinned images, in tag order, skipping those without one", () => {
    expect(
      listSceneReferenceImages({
        tags,
        sheetGroups,
        tagCategories: ["characters"]
      })
    ).toEqual([
      { assetId: "asset-maya", name: "Maya" },
      { assetId: "asset-leo", name: "Leo" }
    ]);
  });

  it("lists every tagged asset but never the storyboard itself", () => {
    expect(
      listSceneReferenceImages({
        tags,
        sheetGroups,
        tagCategories: ["characters", "environments", "props"]
      }).map((referenceImage) => referenceImage.assetId)
    ).toEqual(["asset-maya", "asset-leo", "asset-kitchen", "asset-note"]);
  });
});
