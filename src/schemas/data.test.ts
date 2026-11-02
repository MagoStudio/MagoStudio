import { describe, expect, it } from "vitest";

import { DataSchema } from "@/schemas/data";

const baseData = {
  duration: 1,
  processed: true,
  fps: 24,
  total_frames: 24,
  size: [1280, 720] as [number, number],
  renderSettings: { magov2: {} },
  renderEngine: "magov2" as const,
  parent_render: "parent-render-id",
  thumbnails: []
};

describe("DataSchema data.data.sources.images unified role taxonomy", () => {
  it.each([
    "reference_frame",
    "key_frame",
    "element_reference",
    "element_frontal",
    "motion_reference",
    "style_reference"
  ])("accepts a %s entry", (type) => {
    const result = DataSchema.safeParse({
      ...baseData,
      data: {
        parent_layer_id: "layer-1",
        sources: {
          video: "video-asset-id",
          images: [{ asset_id: "an-asset", type, index: 0 }]
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown role", () => {
    const result = DataSchema.safeParse({
      ...baseData,
      data: {
        parent_layer_id: "layer-1",
        sources: {
          video: "video-asset-id",
          images: [{ asset_id: "an-asset", type: "not_a_real_role" }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects an entry with an empty asset_id", () => {
    const result = DataSchema.safeParse({
      ...baseData,
      data: {
        parent_layer_id: "layer-1",
        sources: {
          video: "video-asset-id",
          images: [{ asset_id: "", type: "reference_frame" }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer index", () => {
    const result = DataSchema.safeParse({
      ...baseData,
      data: {
        parent_layer_id: "layer-1",
        sources: {
          video: "video-asset-id",
          images: [{ asset_id: "an-asset", type: "key_frame", index: 1.5 }]
        }
      }
    });
    expect(result.success).toBe(false);
  });

  it("accepts an entry without an index (index is optional)", () => {
    const result = DataSchema.safeParse({
      ...baseData,
      data: {
        parent_layer_id: "layer-1",
        sources: {
          video: "video-asset-id",
          images: [{ asset_id: "an-asset", type: "reference_frame" }]
        }
      }
    });
    expect(result.success).toBe(true);
  });
});
