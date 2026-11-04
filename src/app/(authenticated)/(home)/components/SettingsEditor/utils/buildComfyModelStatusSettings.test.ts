import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildComfyModelStatusSettings } from "./buildComfyModelStatusSettings";

describe("buildComfyModelStatusSettings", () => {
  it("sends the model size setting a ComfyUI model depends on", () => {
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.wan_vace_2_1,
        renderSettingsValues: { vace_model_size: "14b", prompt: "rain" },
        sources: []
      })
    ).toEqual({ vace_model_size: "14b" });
  });

  it("sends MiniMax H3 quality, task and edited frame", () => {
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: { h3_quality: "hd", vfx_mode: "vfx_edit" },
        sources: [{ asset_id: "edited", type: "key_frame" }]
      })
    ).toEqual({
      h3_quality: "hd",
      vfx_mode: "vfx_edit",
      vfx_edited_frame_id: "edited"
    });
  });

  it("leaves the edited frame out of other MiniMax H3 tasks and empty slots", () => {
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: { vfx_mode: "head_swap" },
        sources: [{ asset_id: "edited", type: "key_frame" }]
      }).vfx_edited_frame_id
    ).toBeUndefined();
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: { vfx_mode: "vfx_edit" },
        sources: [{ asset_id: "", type: "key_frame" }]
      }).vfx_edited_frame_id
    ).toBeUndefined();
  });

  it("finds the Edited frame after an empty slot, like the render does", () => {
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.minimax_h3_local,
        renderSettingsValues: { vfx_mode: "vfx_edit" },
        sources: [
          { asset_id: "", type: "key_frame" },
          { asset_id: "edited", type: "key_frame" }
        ]
      }).vfx_edited_frame_id
    ).toBe("edited");
  });

  it("sends nothing for a model without dependency settings", () => {
    expect(
      buildComfyModelStatusSettings({
        modelName: VideoEngine.wan_animate_2_2,
        renderSettingsValues: { prompt: "rain" },
        sources: []
      })
    ).toEqual({});
  });
});
