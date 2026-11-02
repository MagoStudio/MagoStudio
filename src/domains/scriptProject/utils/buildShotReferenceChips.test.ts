import { SheetGroup, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildShotReferenceChips } from "./buildShotReferenceChips";

const sergeantGroup: SheetGroup = {
  token: "sergeant",
  name: "Sergeant Kovac",
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: "layer-sergeant",
  layer_order: 0,
  selected_asset_id: "asset-sergeant-v2",
  effective_asset_id: "asset-sergeant-v2",
  effective_source: null,
  images: [
    {
      asset_id: "asset-sergeant-v3",
      clip_id: "clip-3",
      name: "sergeant_v3",
      status: "success",
      source: "render",
      url: "https://example.test/v3.png",
      thumbnail_url: "https://example.test/v3-thumb.png",
      created_at: null,
      has_description: false
    },
    {
      asset_id: "asset-sergeant-v2",
      clip_id: "clip-2",
      name: "sergeant_v2",
      status: "success",
      source: "render",
      url: "https://example.test/v2.png",
      thumbnail_url: "https://example.test/v2-thumb.png",
      created_at: null,
      has_description: false
    }
  ]
};

const medicGroup: SheetGroup = {
  token: "medic",
  name: "Medic",
  kind: "character",
  description: null,
  prompt: null,
  enabled: true,
  layer_id: "layer-medic",
  layer_order: 1,
  selected_asset_id: null,
  effective_asset_id: null,
  effective_source: null,
  images: []
};

const shotTagging = (
  tags: ShotState["tags"],
  references: ShotState["references"],
  missingReferences: ShotState["missing_references"] = []
): ShotState => ({
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 2,
  heading: "EXT. RUINED COLONY",
  video_prompt: "Slow push past the fallen strut.",
  tags,
  references,
  missing_references: missingReferences,
  dropped: false,
  hidden: false,
  manual: false
});

describe("buildShotReferenceChips", () => {
  it("names the pinned version that would go into the render", () => {
    const chips = buildShotReferenceChips(
      shotTagging(
        { characters: ["sergeant"], environments: [], props: [] },
        {
          characters: [{ token: "sergeant", asset_id: "asset-sergeant-v2" }]
        }
      ),
      [sergeantGroup]
    );

    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({
      token: "sergeant",
      name: "Sergeant Kovac",
      versionName: "sergeant_v2",
      thumbnailUrl: "https://example.test/v2-thumb.png",
      missingReason: null
    });
  });

  it("marks a tagged entity the backend could not resolve, with its reason", () => {
    const chips = buildShotReferenceChips(
      shotTagging({ characters: ["medic"], environments: [], props: [] }, {}, [
        { token: "medic", reason: "no image" }
      ]),
      [medicGroup]
    );

    expect(chips[0]).toMatchObject({
      token: "medic",
      assetId: null,
      versionName: null,
      missingReason: "no image"
    });
  });

  it("reports a disabled entity with the reason the backend gave", () => {
    const chips = buildShotReferenceChips(
      shotTagging({ characters: ["medic"], environments: [], props: [] }, {}, [
        { token: "medic", reason: "disabled" }
      ]),
      [medicGroup]
    );

    expect(chips[0]?.missingReason).toBe("disabled");
  });

  it("falls back to 'no image' when a tag resolves to nothing and is unexplained", () => {
    const chips = buildShotReferenceChips(
      shotTagging({ characters: ["medic"], environments: [], props: [] }, {}),
      [medicGroup]
    );

    expect(chips[0]?.missingReason).toBe("no image");
  });

  it("orders chips characters, then environments, then props", () => {
    const chips = buildShotReferenceChips(
      shotTagging(
        {
          characters: ["sergeant"],
          environments: ["colony"],
          props: ["rifle"]
        },
        {}
      ),
      [sergeantGroup]
    );

    expect(chips.map((chip) => chip.token)).toEqual([
      "sergeant",
      "colony",
      "rifle"
    ]);
  });

  it("falls back to the token when the entity has no cast slot", () => {
    const chips = buildShotReferenceChips(
      shotTagging({ characters: [], environments: [], props: ["rifle"] }, {}),
      []
    );

    expect(chips[0]).toMatchObject({
      token: "rifle",
      name: "rifle",
      kind: null
    });
  });
});
