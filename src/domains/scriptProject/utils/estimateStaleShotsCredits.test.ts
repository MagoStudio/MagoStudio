import { VideoEngine } from "@models/video/types";
import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { estimateStaleShotsCredits } from "./estimateStaleShotsCredits";
import { resolveShotRenderFrames } from "./resolveShotRenderFrames";

const OUTPUT_SIZE: [number, number] = [1368, 768];
const PROJECT_SHOT_FRAMES = 124;

const shot = (durationSeconds: number | null): ShotState =>
  ({
    timeline_id: `shot-${durationSeconds}`,
    shot_index: 0,
    sequence_id: 1,
    duration_s: durationSeconds,
    tags: { characters: [], environments: [], props: [] },
    references: {},
    missing_references: []
  }) as unknown as ShotState;

const priceOf = (durationSeconds: number | null) =>
  estimateShotRenderCredits({
    shotEngine: VideoEngine.minimax_reference,
    outputSize: OUTPUT_SIZE,
    shotFrames: resolveShotRenderFrames({
      shotDurationSeconds: durationSeconds,
      projectShotFrames: PROJECT_SHOT_FRAMES
    }),
    referenceImageCount: 0
  });

describe("estimateStaleShotsCredits", () => {
  it("does not quote disabled quality retries on Seedance", () => {
    expect(
      estimateStaleShotsCredits({
        staleShots: [shot(5)],
        shotEngine: VideoEngine.seedance_2_5,
        outputSize: [1280, 720],
        projectShotFrames: PROJECT_SHOT_FRAMES,
        attemptsPerShot: 4
      })
    ).toBe(5 * 566);
  });
  it("costs nothing when no shot would render", () => {
    expect(
      estimateStaleShotsCredits({
        staleShots: [],
        shotEngine: VideoEngine.minimax_reference,
        outputSize: OUTPUT_SIZE,
        projectShotFrames: PROJECT_SHOT_FRAMES,
        attemptsPerShot: 1
      })
    ).toBe(0);
  });

  it("prices each shot at its own length rather than one length for all", () => {
    const total = estimateStaleShotsCredits({
      staleShots: [shot(5), shot(10)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });

    expect(total).toBe(priceOf(5) + priceOf(10));
    expect(priceOf(5)).not.toBe(priceOf(10));
  });

  it("prices a shot with no duration of its own at the project-wide length", () => {
    const total = estimateStaleShotsCredits({
      staleShots: [shot(null)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });

    expect(total).toBe(priceOf(null));
  });

  it("bills every quality attempt", () => {
    const oneAttempt = estimateStaleShotsCredits({
      staleShots: [shot(8)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });
    const threeAttempts = estimateStaleShotsCredits({
      staleShots: [shot(8)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 3
    });

    expect(oneAttempt).toBe(604);
    expect(threeAttempts).toBe(1812);
  });

  it("prices with the selected engine", () => {
    const slowTotal = estimateStaleShotsCredits({
      staleShots: [shot(5)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });
    const fastTotal = estimateStaleShotsCredits({
      staleShots: [shot(5)],
      shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });

    expect(slowTotal).toBe(405);
    expect(fastTotal).toBe(820);
  });

  it("threads the Shot's reference images into the price", () => {
    const fiveReferenceShot = {
      ...shot(5),
      references: {
        characters: [
          { token: "@a", asset_id: "a1" },
          { token: "@b", asset_id: "a2" },
          { token: "@c", asset_id: "a3" }
        ],
        environments: [
          { token: "@d", asset_id: "a4" },
          { token: "@e", asset_id: "a5" }
        ]
      }
    } as ShotState;

    const withReferences = estimateStaleShotsCredits({
      staleShots: [fiveReferenceShot],
      shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1
    });

    expect(withReferences).toBe(862);
  });
});
