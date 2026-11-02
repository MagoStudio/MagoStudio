import { describe, expect, it } from "vitest";

import { buildLocalScriptRenderStats } from "./localScriptRenderStats";

describe("buildLocalScriptRenderStats", () => {
  it("recovers completed video and upscale wall-clock time", () => {
    const stats = buildLocalScriptRenderStats({
      planDetails: {
        plan: {
          steps: [
            {
              tool_name: "poll_video_render",
              status: "COMPLETED",
              started_at: "2026-09-29T10:00:00.000Z",
              finished_at: "2026-09-29T10:02:00.000Z",
              result: { render_asset_id: "video-1" }
            },
            {
              tool_name: "timeline_upscale",
              status: "COMPLETED",
              started_at: "2026-09-29T10:03:00.000Z",
              finished_at: "2026-09-29T10:03:30.000Z",
              result: { asset_id: "upscale-1" }
            }
          ]
        }
      }
    });

    expect(
      Object.values(stats).map((entry) => entry.render_time_in_seconds)
    ).toEqual([120, 30]);
    expect(stats["local-script-video-1"]?.model).toBe("minimax-h3-local");
  });
});
