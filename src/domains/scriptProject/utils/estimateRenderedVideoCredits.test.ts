import { ProjectCut } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { estimateRenderedVideoCredits } from "./estimateRenderedVideoCredits";
import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { SHOT_FPS, snapShotSecondsToFrames } from "./snapShotFrames";

const buildCut = (versions: unknown[]): ProjectCut =>
  ({
    project_id: "project-1",
    shots: [{ timeline_id: "shot-1", versions }],
    missing: [],
    export: null
  }) as unknown as ProjectCut;

const OUTPUT_SIZE: [number, number] = [1280, 720];
const SHOT_SECONDS = 5;

const completedVersion = (overrides: Record<string, unknown> = {}) => ({
  asset_id: "a",
  ready: true,
  status: "success",
  url: null,
  render_spec: {
    output_size: OUTPUT_SIZE,
    duration_s: SHOT_SECONDS,
    engine: "minimax_h3_max"
  },
  ...overrides
});

const expectedCredits = estimateShotRenderCredits({
  shotEngine: "minimax_h3_max",
  outputSize: OUTPUT_SIZE,
  shotFrames: snapShotSecondsToFrames(SHOT_SECONDS),
  referenceImageCount: 0
});

describe("estimateRenderedVideoCredits", () => {
  it("returns zero without a cut", () => {
    expect(estimateRenderedVideoCredits(undefined)).toBe(0);
  });

  it("prices a completed version from its recorded engine, size and duration", () => {
    expect(estimateRenderedVideoCredits(buildCut([completedVersion()]))).toBe(
      expectedCredits
    );
  });

  it("derives the duration from an inclusive frame range", () => {
    const inclusiveFrameRange = [0, SHOT_SECONDS * SHOT_FPS - 1];
    const credits = estimateRenderedVideoCredits(
      buildCut([
        completedVersion({
          render_spec: {
            output_size: OUTPUT_SIZE,
            frame_range: inclusiveFrameRange,
            engine: "minimax_h3_max"
          }
        })
      ])
    );

    expect(credits).toBe(expectedCredits);
  });

  it("skips unfinished versions, timeline upscales and repeated assets", () => {
    const credits = estimateRenderedVideoCredits(
      buildCut([
        completedVersion(),
        completedVersion(),
        completedVersion({ asset_id: "b", ready: false, status: "pending" }),
        completedVersion({ asset_id: "c", timeline_upscale_of: "a" })
      ])
    );

    expect(credits).toBe(expectedCredits);
  });

  it("skips versions with no output size or no duration", () => {
    const credits = estimateRenderedVideoCredits(
      buildCut([
        completedVersion({
          asset_id: "b",
          render_spec: { duration_s: SHOT_SECONDS }
        }),
        completedVersion({
          asset_id: "c",
          render_spec: { output_size: OUTPUT_SIZE }
        })
      ])
    );

    expect(credits).toBe(0);
  });
});
