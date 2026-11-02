import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { reconstructLocalVideoReferenceSources } from "./reconstructLocalVideoReferenceSources";

describe("reconstructLocalVideoReferenceSources", () => {
  it("rebuilds the Wan reference from settings.image_ids as a reference_frame", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.wan_vace_2_1, {
        image_ids: ["asset-1"]
      })
    ).toEqual([{ asset_id: "asset-1", type: "reference_frame" }]);
  });

  it("covers every Comfy local video model", () => {
    for (const engine of [
      VideoEngine.wan_animate_2_2,
      VideoEngine.wan_vace_2_1,
      VideoEngine.mago_style_transfer_local,
      VideoEngine.mago_animate
    ]) {
      expect(
        reconstructLocalVideoReferenceSources(engine, {
          image_ids: ["ref"]
        })
      ).toEqual([{ asset_id: "ref", type: "reference_frame" }]);
    }
  });

  it("reads happy_horse references from reference_image_ids", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.happy_horse_1, {
        reference_image_ids: ["hh-1", "hh-2"]
      })
    ).toEqual([
      { asset_id: "hh-1", type: "reference_frame" },
      { asset_id: "hh-2", type: "reference_frame" }
    ]);
  });

  it("returns nothing for a non-local (cloud) engine", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.V5_0_0, {
        image_ids: ["asset-1"]
      })
    ).toEqual([]);
  });

  it("returns nothing when there is no reference id", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.wan_vace_2_1, {})
    ).toEqual([]);
  });

  it("returns nothing for an undefined engine", () => {
    expect(
      reconstructLocalVideoReferenceSources(undefined, { image_ids: ["a"] })
    ).toEqual([]);
  });

  it("restores a MiniMax H3 edited frame without claiming a source frame it never had", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.minimax_h3_local, {
        vfx_mode: "vfx_edit",
        vfx_edited_frame_id: "edited",
        image_ids: ["edited"]
      })
    ).toEqual([{ asset_id: "edited", type: "key_frame" }]);
  });

  it("restores MiniMax H3 reference images as reference images", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.minimax_h3_local, {
        vfx_mode: "head_swap",
        image_ids: ["head"]
      })
    ).toEqual([{ asset_id: "head", type: "reference_frame" }]);
  });

  it("restores where a MiniMax H3 edited frame was taken from, so the range check still runs", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.minimax_h3_local, {
        vfx_mode: "vfx_edit",
        vfx_edited_frame_id: "edited",
        vfx_edited_frame_source_frame: 170
      })
    ).toEqual([{ asset_id: "edited", type: "key_frame", index: 170 }]);
  });

  it("does not restore an empty MiniMax H3 edited frame id", () => {
    expect(
      reconstructLocalVideoReferenceSources(VideoEngine.minimax_h3_local, {
        vfx_mode: "vfx_edit",
        vfx_edited_frame_id: ""
      })
    ).toEqual([]);
  });
});
