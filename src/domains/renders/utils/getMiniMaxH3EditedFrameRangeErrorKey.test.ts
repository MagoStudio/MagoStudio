import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  getMiniMaxH3EditedFrameRangeErrorKey,
  MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY
} from "./getMiniMaxH3EditedFrameRangeErrorKey";

const errorKeyFor = ({
  modifyFrameSourceFrame,
  rangeStart = 150,
  vfxMode = "vfx_edit",
  modelName = VideoEngine.minimax_h3_local
}: {
  modifyFrameSourceFrame?: number;
  rangeStart?: number;
  vfxMode?: string;
  modelName?: string;
}) =>
  getMiniMaxH3EditedFrameRangeErrorKey({
    modelName,
    renderSettingsValues: {
      vfx_mode: vfxMode,
      keyframe_index: modifyFrameSourceFrame,
      keyframe_index_asset_id:
        modifyFrameSourceFrame === undefined ? undefined : "edited"
    },
    sources: [
      {
        asset_id: "edited",
        type: "key_frame",
        index: modifyFrameSourceFrame ?? 0
      }
    ],
    rangeFrames: [rangeStart, 200]
  });

describe("getMiniMaxH3EditedFrameRangeErrorKey", () => {
  it("blocks an edited frame taken from another frame than the range start", () => {
    expect(errorKeyFor({ modifyFrameSourceFrame: 170 })).toBe(
      MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY
    );
  });

  it("accepts an edited frame taken from the range start", () => {
    expect(errorKeyFor({ modifyFrameSourceFrame: 150 })).toBeUndefined();
  });

  it("blocks an edited frame taken from frame 0 when the range starts later", () => {
    expect(errorKeyFor({ modifyFrameSourceFrame: 0 })).toBe(
      MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY
    );
  });

  it("accepts an uploaded edited frame, whose source frame is unknown", () => {
    expect(errorKeyFor({})).toBeUndefined();
  });

  it("accepts an upload that replaced a frame Modify Frame took from frame 0", () => {
    expect(
      getMiniMaxH3EditedFrameRangeErrorKey({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: {
          vfx_mode: "vfx_edit",
          keyframe_index: 0,
          keyframe_index_asset_id: "modified"
        },
        sources: [{ asset_id: "uploaded", type: "key_frame", index: 0 }],
        rangeFrames: [150, 200]
      })
    ).toBeUndefined();
  });

  it("checks a reused render against the source frame it saved", () => {
    expect(
      getMiniMaxH3EditedFrameRangeErrorKey({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: {
          vfx_mode: "vfx_edit",
          vfx_edited_frame_id: "edited",
          vfx_edited_frame_source_frame: 0
        },
        sources: [{ asset_id: "edited", type: "key_frame", index: 0 }],
        rangeFrames: [150, 200]
      })
    ).toBe(MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY);
  });

  it("ignores other tasks and other models", () => {
    expect(
      errorKeyFor({ modifyFrameSourceFrame: 170, vfxMode: "head_swap" })
    ).toBeUndefined();
    expect(
      errorKeyFor({
        modifyFrameSourceFrame: 170,
        modelName: VideoEngine.mago_style_transfer_local
      })
    ).toBeUndefined();
  });

  it("ignores an Edited frame slot with no image in it", () => {
    expect(
      getMiniMaxH3EditedFrameRangeErrorKey({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: { vfx_mode: "vfx_edit" },
        sources: [{ asset_id: "", type: "key_frame", index: 170 }],
        rangeFrames: [150, 200]
      })
    ).toBeUndefined();
  });
});
