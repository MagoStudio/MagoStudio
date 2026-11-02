import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildLocalVideoRenderSettings } from "./buildLocalVideoRenderSettings";

describe("buildLocalVideoRenderSettings", () => {
  it("always sends MiniMax H3 local its source video, ignoring a stale switch", () => {
    const wireSettings = { prompt: "a street" };
    expect(
      buildLocalVideoRenderSettings({
        model: VideoEngine.minimax_h3_local,
        wireSettings,
        panelSettings: { use_video_reference: false }
      })
    ).toBe(wireSettings);
  });

  it("leaves models without the switch unchanged", () => {
    const wireSettings = { prompt: "a street" };
    expect(
      buildLocalVideoRenderSettings({
        model: VideoEngine.wan_vace_2_1,
        wireSettings,
        panelSettings: { use_video_reference: false }
      })
    ).toBe(wireSettings);
  });
});
