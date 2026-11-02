import { describe, expect, it } from "vitest";

import { AssetSchema, AssetType } from "@/schemas/asset";

const baseAsset = {
  id: "asset-1",
  name: "test",
  filepath: "/test.mp4",
  type: AssetType.VIDEO,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  origin: "uploaded" as const,
  last_used: new Date().toISOString(),
  rate: 1,
  data: {}
};

const controlNetEntry = {
  video: "/cn.mp4",
  name: "depth",
  metadata: { fps: 24, width: 1920, height: 1080, nb_frames: 48 }
};

describe("AssetSchema manifest", () => {
  it("parses controlNets (PUT /layers response)", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      manifest: { controlNets: [controlNetEntry] }
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifest?.controlNets).toHaveLength(1);
  });

  it("normalizes controlNetCache into controlNets (GET /projects response)", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      manifest: { controlNetCache: [controlNetEntry] }
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifest?.controlNets).toHaveLength(1);
    expect(result.data?.manifest?.controlNets[0].name).toBe("depth");
  });

  it("parses controlNet entry with settings sub-object", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      manifest: {
        controlNetCache: [
          {
            ...controlNetEntry,
            settings: {
              frame_range: [0, 10],
              max_size: 1920,
              enable_facemesh_blending: true
            }
          }
        ]
      }
    });
    expect(result.success).toBe(true);
    expect(result.data?.manifest?.controlNets[0].settings?.max_size).toBe(1920);
  });

  it("controlNets defaults to empty array when manifest has neither key", () => {
    const result = AssetSchema.safeParse({ ...baseAsset, manifest: {} });
    expect(result.success).toBe(true);
    expect(result.data?.manifest?.controlNets).toEqual([]);
  });
});

describe("AssetSchema sources.images legacy category passthrough", () => {
  it("accepts legacy reference_frame entries that still carry a category field", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      data: {
        sources: {
          images: [
            {
              asset_id: "legacy",
              type: "reference_frame",
              category: "background"
            }
          ]
        }
      }
    });
    expect(result.success).toBe(true);
  });
});

describe("AssetSchema data.data.sources.images unified role taxonomy", () => {
  it.each([
    "reference_frame",
    "key_frame",
    "element_reference",
    "element_frontal",
    "motion_reference",
    "style_reference"
  ])("accepts a %s entry echoed back by the backend", (type) => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      data: {
        data: {
          sources: {
            images: [{ asset_id: "echoed-asset", type, index: 0 }]
          }
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects an entry with an empty asset_id", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      data: {
        data: {
          sources: {
            images: [{ asset_id: "", type: "reference_frame" }]
          }
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer index", () => {
    const result = AssetSchema.safeParse({
      ...baseAsset,
      data: {
        data: {
          sources: {
            images: [{ asset_id: "a", type: "key_frame", index: 1.5 }]
          }
        }
      }
    });
    expect(result.success).toBe(false);
  });
});
