import { CutShot } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildCutTimelineClips } from "./buildCutTimelineClips";

const FALLBACK_FRAMES = 73;

const buildCutShot = (overrides: Partial<CutShot>): CutShot => ({
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  heading: "INT. ABBEY - NIGHT",
  asset_id: "asset-1",
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: "https://example.com/shot-1.mp4",
  poster_url: "https://example.com/shot-1.jpg",
  versions: [],
  ...overrides
});

describe("buildCutTimelineClips", () => {
  it("turns a measured duration into frames at the shot rate", () => {
    const { clips } = buildCutTimelineClips(
      [buildCutShot({})],
      { "asset-1": 3 },
      FALLBACK_FRAMES
    );

    expect(clips[0]?.durationFrames).toBe(72);
    expect(clips[0]?.isClipDurationMeasured).toBe(true);
  });

  it("falls back to the nominal length for a shot with no render", () => {
    const { clips } = buildCutTimelineClips(
      [buildCutShot({ asset_id: null, url: null })],
      {},
      FALLBACK_FRAMES
    );

    expect(clips[0]?.durationFrames).toBe(FALLBACK_FRAMES);
    expect(clips[0]?.isClipDurationMeasured).toBe(false);
    expect(clips[0]?.isClipPlayable).toBe(false);
    expect(clips[0]?.doesClipHaveRender).toBe(false);
  });

  it("shows a render whose url has expired, but will not play it", () => {
    const { clips } = buildCutTimelineClips(
      [buildCutShot({ url: null })],
      {},
      FALLBACK_FRAMES
    );

    expect(clips[0]?.doesClipHaveRender).toBe(true);
    expect(clips[0]?.isClipPlayable).toBe(false);
  });

  it("lays each clip down where the one before it ended", () => {
    const { clips, totalDurationFrames } = buildCutTimelineClips(
      [
        buildCutShot({ timeline_id: "a", shot_index: 0, asset_id: "asset-a" }),
        buildCutShot({ timeline_id: "b", shot_index: 1, asset_id: "asset-b" })
      ],
      { "asset-a": 2, "asset-b": 3 },
      FALLBACK_FRAMES
    );

    expect(clips.map((clip) => clip.startFrame)).toEqual([0, 48]);
    expect(totalDurationFrames).toBe(120);
  });

  it("counts a placeholder towards the total, so it holds its place", () => {
    const { totalDurationFrames } = buildCutTimelineClips(
      [
        buildCutShot({ timeline_id: "a", shot_index: 0, asset_id: "asset-a" }),
        buildCutShot({
          timeline_id: "b",
          shot_index: 1,
          asset_id: null,
          url: null
        })
      ],
      { "asset-a": 2 },
      FALLBACK_FRAMES
    );

    expect(totalDurationFrames).toBe(48 + FALLBACK_FRAMES);
  });

  it("orders clips by shot index, whatever order the cut arrives in", () => {
    const { clips } = buildCutTimelineClips(
      [
        buildCutShot({ timeline_id: "c", shot_index: 2 }),
        buildCutShot({ timeline_id: "a", shot_index: 0 }),
        buildCutShot({ timeline_id: "b", shot_index: 1 })
      ],
      {},
      FALLBACK_FRAMES
    );

    expect(clips.map((clip) => clip.timelineId)).toEqual(["a", "b", "c"]);
  });

  it("marks a clip whose every render failed", () => {
    const { clips } = buildCutTimelineClips(
      [
        buildCutShot({
          versions: [
            {
              layer_id: "layer-1",
              asset_id: "asset-1",
              name: null,
              ready: false,
              status: "error",
              url: null,
              poster_url: null
            }
          ]
        })
      ],
      {},
      FALLBACK_FRAMES
    );

    expect(clips[0]?.hasClipRenderFailed).toBe(true);
  });

  it("has nothing to lay out for an empty cut", () => {
    expect(buildCutTimelineClips([], {}, FALLBACK_FRAMES)).toEqual({
      clips: [],
      totalDurationFrames: 0
    });
  });
});
