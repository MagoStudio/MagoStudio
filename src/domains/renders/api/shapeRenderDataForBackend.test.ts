import { MAX_SOURCE_IMAGES, SourceImage } from "@domains/renders/types";
import { parseSourcesForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";
import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  shapeRenderDataForBackend,
  shapeSourcesForBackend,
  stripLegacySourceSettingKey,
  stripStaleBackendReferenceKeys
} from "./shapeRenderDataForBackend";

const baseInput = {
  inputTrackId: "video-1",
  legacyIpadapterImageSource: undefined
};

describe("shapeSourcesForBackend — reference-only Mago engines (v4.0.0, v4.1.0, v5.0.0)", () => {
  it.each([VideoEngine.V4_0_0, VideoEngine.V4_1_0, VideoEngine.V5_0_0])(
    "maps the single style image to a lone reference_frame for %s",
    (engine) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [{ asset_id: "a", type: "key_frame", index: 0 }],
        engine
      });
      expect(result.images).toEqual([
        { asset_id: "a", type: "reference_frame" }
      ]);
      expect(result.ipadapter_image_source).toBeUndefined();
    }
  );

  it("omits images when sources is empty", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [],
      engine: VideoEngine.V5_0_0
    });
    expect(result).toEqual({ video: "video-1" });
    expect(result.images).toBeUndefined();
    expect(result.ipadapter_image_source).toBeUndefined();
  });

  it("drops an explicit key_frame index for v5.0.0 (keyframe number is a UI-only nudge)", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [{ asset_id: "a", type: "key_frame", index: 7 }],
      engine: VideoEngine.V5_0_0
    });
    expect(result.images).toEqual([{ asset_id: "a", type: "reference_frame" }]);
  });

  it("upgrades a legacy ipadapter_image_source into a reference_frame when sources is empty", () => {
    const result = shapeSourcesForBackend({
      inputTrackId: "video-1",
      sources: [],
      engine: VideoEngine.V4_1_0,
      legacyIpadapterImageSource: "legacy-id"
    });
    expect(result.images).toEqual([
      { asset_id: "legacy-id", type: "reference_frame" }
    ]);
    expect(result.ipadapter_image_source).toBeUndefined();
  });
});

describe("shapeSourcesForBackend — v5.0.0 never emits the legacy scalar", () => {
  it("sends the style image inside images[] and no ipadapter_image_source", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: {},
      sources: [{ asset_id: "kf", type: "key_frame", index: 0 }],
      engine: VideoEngine.V5_0_0,
      inputTrackId: "video-1"
    });
    expect(result.sources.images).toEqual([
      { asset_id: "kf", type: "reference_frame" }
    ]);
    expect(result.sources.ipadapter_image_source).toBeUndefined();
  });

  it("upgrades a legacy scalar source into an images[] reference_frame", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: { ipadapter_image_source: "legacy-id" },
      sources: [],
      engine: VideoEngine.V5_0_0,
      inputTrackId: "video-1"
    });
    expect(result.sources.images).toEqual([
      { asset_id: "legacy-id", type: "reference_frame" }
    ]);
    expect(result.sources.ipadapter_image_source).toBeUndefined();
  });
});

describe("shapeSourcesForBackend — v3.4 emits both reference_frame and key_frame", () => {
  it.each([VideoEngine.V3_4_0])(
    "emits the same image as reference_frame and key_frame for %s",
    (engine) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [{ asset_id: "a", type: "key_frame", index: 3 }],
        engine
      });
      expect(result.images).toEqual([
        { asset_id: "a", type: "key_frame", index: 3 },
        { asset_id: "a", type: "reference_frame" }
      ]);
    }
  );

  it("defaults the key_frame index to 0 for a reference_frame-only source", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [{ asset_id: "ref", type: "reference_frame" }],
      engine: VideoEngine.V3_4_0
    });
    expect(result.images).toEqual([
      { asset_id: "ref", type: "key_frame", index: 0 },
      { asset_id: "ref", type: "reference_frame" }
    ]);
  });

  it("reads a legacy ipadapter_image_source out of renderSettings and emits both types", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: { ipadapter_image_source: "legacy-id" },
      sources: [],
      engine: VideoEngine.V3_4_0,
      inputTrackId: "video-1"
    });
    expect(result.sources.images).toEqual([
      { asset_id: "legacy-id", type: "key_frame", index: 0 },
      { asset_id: "legacy-id", type: "reference_frame" }
    ]);
  });

  it("round-trips the v3.4 dual-emit back to a single key_frame on read", () => {
    const shaped = shapeSourcesForBackend({
      ...baseInput,
      sources: [{ asset_id: "a", type: "key_frame", index: 3 }],
      engine: VideoEngine.V3_4_0
    });
    const restored = parseSourcesForFrontend({ sources: shaped });
    expect(restored).toEqual([{ asset_id: "a", type: "key_frame", index: 3 }]);
  });
});

describe("shapeSourcesForBackend — out-of-scope Mago engines pass sources through", () => {
  it("keeps entries verbatim and sorts key_frames by index", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [
        { asset_id: "k5", type: "key_frame", index: 5 },
        { asset_id: "k1", type: "key_frame", index: 1 },
        { asset_id: "r1", type: "reference_frame" }
      ],
      engine: VideoEngine.V3_3_0_CNETS
    });
    expect(result.images).toEqual([
      { asset_id: "k1", type: "key_frame", index: 1 },
      { asset_id: "k5", type: "key_frame", index: 5 },
      { asset_id: "r1", type: "reference_frame" }
    ]);
  });

  it("caps at 64 entries", () => {
    const sources = Array.from({ length: 70 }, (_, i) => ({
      asset_id: `r${i}`,
      type: "reference_frame" as const
    }));
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources,
      engine: VideoEngine.V3_3_0_CNETS
    });
    expect(result.images).toHaveLength(64);
    expect(result.images?.[63].asset_id).toBe("r63");
  });

  it("keeps a team-only legacy engine (v2.5.0) key_frame verbatim", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [{ asset_id: "a", type: "key_frame", index: 2 }],
      engine: VideoEngine.V2_5_0
    });
    expect(result.images).toEqual([
      { asset_id: "a", type: "key_frame", index: 2 }
    ]);
  });

  it("preserves input_mask passthrough (v5.1.0 inpainting)", () => {
    const result = shapeSourcesForBackend({
      inputTrackId: "video-1",
      inputMask: "mask-1",
      sources: [{ asset_id: "a", type: "reference_frame" }],
      engine: VideoEngine.V5_1_0
    });
    expect(result.images).toEqual([{ asset_id: "a", type: "reference_frame" }]);
    expect(result.input_mask).toBe("mask-1");
  });
});

describe("shapeSourcesForBackend — upscalers emit no images[]", () => {
  it.each([VideoEngine.v1_0_0_upscaler, VideoEngine.v2_0_0_esrgan_upscaler])(
    "emits neither images nor ipadapter_image_source for %s",
    (engine) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [],
        engine
      });
      expect(result).toEqual({ video: "video-1" });
      expect(result.images).toBeUndefined();
      expect(result.ipadapter_image_source).toBeUndefined();
    }
  );
});

describe("shapeSourcesForBackend (non-Mago engines)", () => {
  it.each([
    VideoEngine.kling_2_6_motion_control,
    VideoEngine.kling_3_motion_control
  ])(
    "collapses first reference_frame entry to ipadapter_image_source for %s",
    (engine) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [
          { asset_id: "kf", type: "key_frame", index: 0 },
          { asset_id: "ref", type: "reference_frame" }
        ],
        engine
      });
      expect(result.ipadapter_image_source).toBe("ref");
      expect(result.images).toBeUndefined();
    }
  );

  it("emits typed sources.images and no ipadapter_image_source when the model owns its sources", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [
        { asset_id: "kf", type: "key_frame", index: 0 },
        { asset_id: "ref", type: "reference_frame" }
      ],
      engine: VideoEngine.kling_2_6_motion_control,
      hasModelOwnedSources: true
    });
    expect(result.ipadapter_image_source).toBeUndefined();
    expect(result.images).toEqual([
      { asset_id: "kf", type: "key_frame", index: 0 },
      { asset_id: "ref", type: "reference_frame" }
    ]);
  });

  it("preserves element and motion roles with their index", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [
        { asset_id: "m", type: "motion_reference" },
        { asset_id: "er", type: "element_reference", index: 0 },
        { asset_id: "ef", type: "element_frontal", index: 0 }
      ],
      engine: VideoEngine.kling_3_motion_control,
      hasModelOwnedSources: true
    });
    expect(result.images).toEqual([
      { asset_id: "m", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("omits images when sources is empty", () => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [],
      engine: VideoEngine.happy_horse_1
    });
    expect(result).toEqual({ video: "video-1" });
  });
});

describe("shapeSourcesForBackend — truncation at MAX_SOURCE_IMAGES never splits an element pair", () => {
  const referenceFrames = (count: number): SourceImage[] =>
    Array.from({ length: count }, (_, index) => ({
      asset_id: `ref-${index}`,
      type: "reference_frame" as const
    }));

  it("drops the entire element pair rather than sending only its reference half when it would straddle the limit", () => {
    const sources: SourceImage[] = [
      ...referenceFrames(MAX_SOURCE_IMAGES - 1),
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];

    const result = shapeSourcesForBackend({
      ...baseInput,
      sources,
      engine: VideoEngine.kling_o1,
      hasModelOwnedSources: true
    });

    expect(result.images).toHaveLength(MAX_SOURCE_IMAGES - 1);
    expect(
      result.images?.some(
        (entry) =>
          entry.type === "element_reference" || entry.type === "element_frontal"
      )
    ).toBe(false);
  });

  it("keeps the element pair intact when both halves fit within the limit", () => {
    const sources: SourceImage[] = [
      ...referenceFrames(MAX_SOURCE_IMAGES - 2),
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];

    const result = shapeSourcesForBackend({
      ...baseInput,
      sources,
      engine: VideoEngine.kling_o1,
      hasModelOwnedSources: true
    });

    expect(result.images).toHaveLength(MAX_SOURCE_IMAGES);
    expect(result.images?.at(-2)).toEqual({
      asset_id: "er",
      type: "element_reference",
      index: 0
    });
    expect(result.images?.at(-1)).toEqual({
      asset_id: "ef",
      type: "element_frontal",
      index: 0
    });
  });

  it("truncates plain reference_frame entries at the limit as before (no pairing concern)", () => {
    const sources = referenceFrames(MAX_SOURCE_IMAGES + 5);

    const result = shapeSourcesForBackend({
      ...baseInput,
      sources,
      engine: VideoEngine.kling_o1,
      hasModelOwnedSources: true
    });

    expect(result.images).toHaveLength(MAX_SOURCE_IMAGES);
  });
});

describe("shapeSourcesForBackend", () => {
  it.each([
    VideoEngine.happy_horse_1,
    VideoEngine.seedance_2,
    VideoEngine.seedance_2_5,
    VideoEngine.kling_o1,
    VideoEngine.kling_o3_edit_pro
  ])("emits no source-derived reference field for %s", (engine) => {
    const result = shapeSourcesForBackend({
      ...baseInput,
      sources: [
        { asset_id: "kf", type: "key_frame", index: 0 },
        { asset_id: "ref", type: "reference_frame" }
      ],
      engine
    });
    expect(result).toEqual({ video: "video-1" });
    expect(result.ipadapter_image_source).toBeUndefined();
    expect(result.images).toBeUndefined();
  });

  it("does not resurrect a legacy ipadapter_image_source for image_ids engines", () => {
    const result = shapeSourcesForBackend({
      inputTrackId: "video-1",
      sources: [],
      engine: VideoEngine.kling_o1,
      legacyIpadapterImageSource: "legacy-id"
    });
    expect(result).toEqual({ video: "video-1" });
    expect(result.ipadapter_image_source).toBeUndefined();
  });

  it("still passes input_mask through for image_ids engines", () => {
    const result = shapeSourcesForBackend({
      inputTrackId: "video-1",
      inputMask: "mask-1",
      sources: [{ asset_id: "ref", type: "reference_frame" }],
      engine: VideoEngine.seedance_2
    });
    expect(result).toEqual({ video: "video-1", input_mask: "mask-1" });
    expect(result.ipadapter_image_source).toBeUndefined();
    expect(result.images).toBeUndefined();
  });
});

describe("shapeRenderDataForBackend", () => {
  it("prefers explicit sources over legacy renderSettings field", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: { ipadapter_image_source: "legacy-id" },
      sources: [{ asset_id: "new-id", type: "reference_frame" }],
      engine: VideoEngine.V4_1_0,
      inputTrackId: "video-1"
    });
    expect(result.sources.images).toEqual([
      { asset_id: "new-id", type: "reference_frame" }
    ]);
  });
});

describe("shapeRenderDataForBackend — doesModelSupportTagsInPrompt gates the sources blob", () => {
  it("produces a bare sources blob for a tags-capable engine (kling_o1), dropping key_frame/reference_frame entirely", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: {},
      sources: [
        { asset_id: "kf", type: "key_frame", index: 0 },
        { asset_id: "ref", type: "reference_frame" }
      ],
      engine: VideoEngine.kling_o1,
      inputTrackId: "video-1"
    });
    expect(result).toEqual({ sources: { video: "video-1" } });
  });

  it("produces a bare sources blob for a tags-capable engine (happy_horse_1) even with a legacy ipadapter_image_source present", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: { ipadapter_image_source: "legacy-id" },
      sources: [],
      engine: VideoEngine.happy_horse_1,
      inputTrackId: "video-1"
    });
    expect(result).toEqual({ sources: { video: "video-1" } });
  });

  it("still collapses to ipadapter_image_source for a non-tags-capable engine (kling_2_6_motion_control)", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: {},
      sources: [
        { asset_id: "kf", type: "key_frame", index: 0 },
        { asset_id: "ref", type: "reference_frame" }
      ],
      engine: VideoEngine.kling_2_6_motion_control,
      inputTrackId: "video-1"
    });
    expect(result).toEqual({
      sources: { video: "video-1", ipadapter_image_source: "ref" }
    });
  });
});

describe("shapeSourcesForBackend — image-to-video engines emit no sources at all", () => {
  it.each([VideoEngine.seedance_2_i2v, VideoEngine.seedance_2_i2v_fast])(
    "shapes to an empty object for %s with a populated sources list and a valid input track id",
    (engine) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [
          { asset_id: "kf", type: "key_frame", index: 0 },
          { asset_id: "ref", type: "reference_frame" }
        ],
        engine
      });
      expect(result).toEqual({});
    }
  );

  it("still shapes to an empty object when an inputMask is present", () => {
    const result = shapeSourcesForBackend({
      inputTrackId: "video-1",
      inputMask: "mask-1",
      sources: [{ asset_id: "ref", type: "reference_frame" }],
      engine: VideoEngine.seedance_2_i2v
    });
    expect(result).toEqual({});
    expect(result.input_mask).toBeUndefined();
  });

  it("shapes to an empty object through shapeRenderDataForBackend as well", () => {
    const result = shapeRenderDataForBackend({
      renderSettings: {},
      sources: [{ asset_id: "ref", type: "reference_frame" }],
      engine: VideoEngine.seedance_2_i2v,
      inputTrackId: "video-1"
    });
    expect(result.sources).toEqual({});
  });

  it.each(
    RENDER_MODELS.filter(
      (model) =>
        model.name !== VideoEngine.seedance_2_i2v &&
        model.name !== VideoEngine.seedance_2_i2v_fast
    )
  )(
    "every non-i2v engine in RENDER_MODELS still emits a video key: $name",
    (model) => {
      const result = shapeSourcesForBackend({
        ...baseInput,
        sources: [],
        engine: model.name
      });
      expect(result.video).toBe("video-1");
    }
  );
});

describe("stripLegacySourceSettingKey", () => {
  it("removes a stale ipadapter_image_source so it never reaches magov2", () => {
    const result = stripLegacySourceSettingKey({
      cfg: 1,
      ipadapter_image_source: "stale-legacy-id"
    });
    expect(result).toEqual({ cfg: 1 });
    expect("ipadapter_image_source" in result).toBe(false);
  });

  it("is a no-op when the legacy key is absent", () => {
    const result = stripLegacySourceSettingKey({ cfg: 1, steps: 8 });
    expect(result).toEqual({ cfg: 1, steps: 8 });
  });
});

describe("stripStaleBackendReferenceKeys", () => {
  it("removes a stale reference_image_paths so it never reaches magov2", () => {
    const result = stripStaleBackendReferenceKeys({
      prompt: "Add snow",
      reference_image_paths: ["uploads/stale.png"]
    });
    expect(result).toEqual({ prompt: "Add snow" });
    expect("reference_image_paths" in result).toBe(false);
  });

  it("removes a stale image_paths (Seedance 2 backend echo)", () => {
    const result = stripStaleBackendReferenceKeys({
      prompt: "Add snow",
      image_paths: ["uploads/stale.png"]
    });
    expect(result).toEqual({ prompt: "Add snow" });
    expect("image_paths" in result).toBe(false);
  });

  it("preserves the FE-managed reference fields (reference_image_ids, image_ids)", () => {
    const result = stripStaleBackendReferenceKeys({
      reference_image_ids: ["id-1"],
      image_ids: ["id-2"],
      reference_image_paths: ["uploads/stale.png"],
      image_paths: ["uploads/stale2.png"]
    });
    expect(result).toEqual({
      reference_image_ids: ["id-1"],
      image_ids: ["id-2"]
    });
  });

  it("is a no-op when no stale backend reference key is present", () => {
    const result = stripStaleBackendReferenceKeys({ cfg: 1, steps: 8 });
    expect(result).toEqual({ cfg: 1, steps: 8 });
  });
});
