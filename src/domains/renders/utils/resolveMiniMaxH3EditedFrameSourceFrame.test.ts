import { describe, expect, it } from "vitest";

import { resolveMiniMaxH3EditedFrameSourceFrame } from "./resolveMiniMaxH3EditedFrameSourceFrame";

const editedFrame = {
  asset_id: "edited",
  type: "key_frame" as const,
  index: 0
};

describe("resolveMiniMaxH3EditedFrameSourceFrame", () => {
  it("knows frame 0 when Modify Frame picked it", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: {
          keyframe_index: 0,
          keyframe_index_asset_id: "edited"
        },
        editedFrame
      })
    ).toBe(0);
  });

  it("treats an upload as unknown even after Modify Frame picked a frame", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: {
          keyframe_index: 0,
          keyframe_index_asset_id: "modified"
        },
        editedFrame
      })
    ).toBeUndefined();
  });

  it("treats an uploaded edited frame as unknown", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: {},
        editedFrame
      })
    ).toBeUndefined();
  });

  it("reads the source frame a reused render saved for the same image", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: {
          vfx_edited_frame_id: "edited",
          vfx_edited_frame_source_frame: 0
        },
        editedFrame
      })
    ).toBe(0);
  });

  it("ignores a saved source frame once the image is replaced", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: {
          vfx_edited_frame_id: "previous",
          vfx_edited_frame_source_frame: 170
        },
        editedFrame
      })
    ).toBeUndefined();
  });

  it("has no source frame without an edited frame", () => {
    expect(
      resolveMiniMaxH3EditedFrameSourceFrame({
        renderSettingsValues: { keyframe_index: 12 },
        editedFrame: undefined
      })
    ).toBeUndefined();
  });
});
