import { describe, expect, it } from "vitest";

import {
  parseRenderDataForFrontend,
  parseSourcesForFrontend
} from "./parseRenderDataForFrontend";

describe("parseSourcesForFrontend", () => {
  it("returns sources.images directly when present", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "x", type: "reference_frame" },
          { asset_id: "y", type: "key_frame", index: 4 }
        ]
      }
    });
    expect(result).toEqual([
      { asset_id: "x", type: "reference_frame" },
      { asset_id: "y", type: "key_frame", index: 4 }
    ]);
  });

  it("collapses the v3.4 dual-emit (same asset as reference_frame + key_frame) to the key_frame", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "a", type: "reference_frame" },
          { asset_id: "a", type: "key_frame", index: 3 }
        ]
      }
    });
    expect(result).toEqual([{ asset_id: "a", type: "key_frame", index: 3 }]);
  });

  it("keeps a reference_frame and key_frame that reference different assets", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "a", type: "key_frame", index: 0 },
          { asset_id: "b", type: "reference_frame" }
        ]
      }
    });
    expect(result).toEqual([
      { asset_id: "a", type: "key_frame", index: 0 },
      { asset_id: "b", type: "reference_frame" }
    ]);
  });

  it("falls back to sources.ipadapter_image_source", () => {
    const result = parseSourcesForFrontend({
      sources: { ipadapter_image_source: "legacy" }
    });
    expect(result).toEqual([{ asset_id: "legacy", type: "reference_frame" }]);
  });

  it("falls back to render_settings.magov2.ipadapter_image_source", () => {
    const result = parseSourcesForFrontend({
      render_settings: { magov2: { ipadapter_image_source: "old" } }
    });
    expect(result).toEqual([{ asset_id: "old", type: "reference_frame" }]);
  });

  it("returns empty array when nothing is present", () => {
    expect(parseSourcesForFrontend({})).toEqual([]);
  });

  it("prefers sources.images over legacy fields when both exist", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [{ asset_id: "new", type: "reference_frame" }],
        ipadapter_image_source: "legacy"
      }
    });
    expect(result).toEqual([{ asset_id: "new", type: "reference_frame" }]);
  });

  it("strips category and collapses legacy V3.4 multi-categorized reference_frames to the first one", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "bg", type: "reference_frame", category: "background" },
          { asset_id: "ch", type: "reference_frame", category: "character" },
          { asset_id: "k", type: "key_frame", index: 0 }
        ]
      }
    });
    expect(result).toEqual([
      { asset_id: "bg", type: "reference_frame" },
      { asset_id: "k", type: "key_frame", index: 0 }
    ]);
  });

  it("preserves multiple uncategorized reference_frame entries", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "a", type: "reference_frame" },
          { asset_id: "b", type: "reference_frame" }
        ]
      }
    });
    expect(result).toEqual([
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" }
    ]);
  });

  it("never adds index to reference_frame entries", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [{ asset_id: "r", type: "reference_frame", index: 2 }]
      }
    });
    expect(result).toEqual([{ asset_id: "r", type: "reference_frame" }]);
  });

  it("drops malformed image entries", () => {
    const result = parseSourcesForFrontend({
      sources: {
        images: [
          { asset_id: "ok", type: "reference_frame" },
          { type: "reference_frame" } as any,
          { asset_id: "x", type: "bogus" } as any
        ]
      }
    });
    expect(result).toEqual([{ asset_id: "ok", type: "reference_frame" }]);
  });
});

describe("parseRenderDataForFrontend", () => {
  it("strips legacy ipadapter_image_source from the returned renderSettings", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          ipadapter_image_source: "legacy"
        }
      }
    });
    expect(result.renderSettings).toEqual({ cfg: 1 });
    expect(result.sources).toEqual([
      { asset_id: "legacy", type: "reference_frame" }
    ]);
  });

  it("returns empty sources for a layer with no image inputs", () => {
    const result = parseRenderDataForFrontend({
      render_settings: { magov2: { cfg: 2 } }
    });
    expect(result.sources).toEqual([]);
    expect(result.renderSettings).toEqual({ cfg: 2 });
  });

  it("extracts and normalizes a stored crop, stripping it from renderSettings", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
          source_video_dimensions: [1920, 1080]
        }
      }
    });

    expect(result.renderSettings).toEqual({ cfg: 1 });
    expect(result.crop).toEqual({ x: 0.1875, y: 0, width: 0.8125, height: 1 });
  });

  it("returns an undefined crop when the render carries no crop fields", () => {
    const result = parseRenderDataForFrontend({
      render_settings: { magov2: { cfg: 1 } }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when source_video_dimensions is missing", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] }
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when crop_coordinates corners are empty objects", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: {}, bottom_right: {} },
          source_video_dimensions: [1920, 1080]
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when a corner is a 1-element array", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: [360], bottom_right: [1920, 1080] },
          source_video_dimensions: [1920, 1080]
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when a corner entry is non-numeric", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: {
            top_left: ["a", 0],
            bottom_right: [1920, 1080]
          },
          source_video_dimensions: [1920, 1080]
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when source_video_dimensions is zero", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
          source_video_dimensions: [0, 1080]
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("returns an undefined crop when source_video_dimensions is negative", () => {
    const result = parseRenderDataForFrontend({
      render_settings: {
        magov2: {
          cfg: 1,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
          source_video_dimensions: [-1920, 1080]
        }
      }
    });

    expect(result.crop).toBeUndefined();
  });

  it("collapses legacy V3.4 categorized payloads to a single reference_frame", () => {
    const result = parseRenderDataForFrontend({
      sources: {
        images: [
          { asset_id: "bg1", type: "reference_frame", category: "background" },
          { asset_id: "ch1", type: "reference_frame", category: "character" }
        ]
      }
    });
    expect(result.sources).toEqual([
      { asset_id: "bg1", type: "reference_frame" }
    ]);
    expect(result.renderSettings).not.toHaveProperty("background_images");
    expect(result.renderSettings).not.toHaveProperty("character_images");
    expect(result.renderSettings).not.toHaveProperty("objects_images");
  });
});
