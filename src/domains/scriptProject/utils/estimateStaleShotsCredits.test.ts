import { VideoEngine } from "@models/video/types";
import { SheetGroup, ShotState } from "@schemas/scriptProject";
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
    referenceImageSizes: []
  });

describe("estimateStaleShotsCredits", () => {
  it("does not quote disabled quality retries on Seedance", () => {
    expect(
      estimateStaleShotsCredits({
        staleShots: [shot(5)],
        shotEngine: VideoEngine.seedance_2_5,
        outputSize: [1280, 720],
        projectShotFrames: PROJECT_SHOT_FRAMES,
        attemptsPerShot: 4,
        sheetGroups: []
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
        attemptsPerShot: 1,
        sheetGroups: []
      })
    ).toBe(0);
  });

  it("prices each shot at its own length rather than one length for all", () => {
    const total = estimateStaleShotsCredits({
      staleShots: [shot(5), shot(10)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1,
      sheetGroups: []
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
      attemptsPerShot: 1,
      sheetGroups: []
    });

    expect(total).toBe(priceOf(null));
  });

  it("bills every quality attempt", () => {
    const oneAttempt = estimateStaleShotsCredits({
      staleShots: [shot(8)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1,
      sheetGroups: []
    });
    const threeAttempts = estimateStaleShotsCredits({
      staleShots: [shot(8)],
      shotEngine: VideoEngine.minimax_reference,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 3,
      sheetGroups: []
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
      attemptsPerShot: 1,
      sheetGroups: []
    });
    const fastTotal = estimateStaleShotsCredits({
      staleShots: [shot(5)],
      shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
      outputSize: OUTPUT_SIZE,
      projectShotFrames: PROJECT_SHOT_FRAMES,
      attemptsPerShot: 1,
      sheetGroups: []
    });

    expect(slowTotal).toBe(405);
    expect(fastTotal).toBe(816);
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
      attemptsPerShot: 1,
      sheetGroups: []
    });

    expect(withReferences).toBe(858);
  });

  it("prices a speaking Shot the same as a silent one, since no render sends a voice", () => {
    const sixWideReferenceShot = {
      ...shot(10),
      references: {
        characters: Array.from({ length: 6 }, (_, index) => ({
          token: `@${index}`,
          asset_id: `wide-${index}`
        }))
      }
    } as ShotState;
    const speakingShot = {
      ...sixWideReferenceShot,
      dialogue: [
        { speaker_token: "mara", line: "Hi" },
        { speaker_token: "joe", line: "Hello" },
        { speaker_token: "ana", line: "Hey" }
      ]
    } as ShotState;
    const sheetGroups = [
      {
        token: "mara",
        images: Array.from({ length: 6 }, (_, index) => ({
          asset_id: `wide-${index}`,
          render_spec: { output_size: [1920, 1080] }
        })),
        voice_signature: { voice_id: "mara-voice" }
      },
      { token: "joe", images: [], voice_signature: { voice_id: "joe-voice" } },
      { token: "ana", images: [], voice_signature: { voice_id: "ana-voice" } }
    ] as unknown as SheetGroup[];
    const priceH3Max = (staleShot: ShotState) =>
      estimateStaleShotsCredits({
        staleShots: [staleShot],
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE,
        projectShotFrames: PROJECT_SHOT_FRAMES,
        attemptsPerShot: 1,
        sheetGroups
      });

    expect(priceH3Max(speakingShot)).toBe(priceH3Max(sixWideReferenceShot));
  });
});
