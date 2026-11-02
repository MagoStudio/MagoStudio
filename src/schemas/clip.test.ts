import { describe, expect, it } from "vitest";

import { AssetType } from "@/schemas/asset";
import { ClipSchema } from "@/schemas/clip";

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

const baseClip = {
  id: "clip-1",
  layer_id: "layer-1",
  name: "clip",
  asset: baseAsset,
  asset_id: baseAsset.id,
  data: {}
};

describe("ClipSchema data.sources.images unified role taxonomy", () => {
  it.each([
    "reference_frame",
    "key_frame",
    "element_reference",
    "element_frontal",
    "motion_reference",
    "style_reference"
  ])("accepts a %s entry", (type) => {
    const result = ClipSchema.safeParse({
      ...baseClip,
      data: {
        sources: {
          images: [{ asset_id: "an-asset", type, index: 0 }]
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown role", () => {
    const result = ClipSchema.safeParse({
      ...baseClip,
      data: {
        sources: {
          images: [{ asset_id: "an-asset", type: "not_a_real_role" }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects an entry with an empty asset_id", () => {
    const result = ClipSchema.safeParse({
      ...baseClip,
      data: {
        sources: {
          images: [{ asset_id: "", type: "reference_frame" }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer index", () => {
    const result = ClipSchema.safeParse({
      ...baseClip,
      data: {
        sources: {
          images: [{ asset_id: "an-asset", type: "key_frame", index: 1.5 }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("accepts an entry without an index (index is optional)", () => {
    const result = ClipSchema.safeParse({
      ...baseClip,
      data: {
        sources: {
          images: [{ asset_id: "an-asset", type: "reference_frame" }]
        }
      }
    });
    expect(result.success).toBe(true);
  });
});
