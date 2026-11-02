import { describe, expect, it } from "vitest";

import { comfyRenderEta } from "./comfyRenderEta";

const now = new Date("2026-09-29T12:00:00.000Z");
const startedSecondsAgo = (seconds: number) =>
  new Date(now.getTime() - seconds * 1000);

describe("comfyRenderEta", () => {
  it("returns nothing while the prompt is still queued in ComfyUI", () => {
    expect(
      comfyRenderEta({
        model: "qwen",
        livePrompt: {
          phase: "queued",
          runStartedAt: null,
          progressFraction: 0
        },
        now
      })
    ).toEqual({});
  });

  it("extrapolates the remaining time from measured progress", () => {
    expect(
      comfyRenderEta({
        model: "qwen",
        livePrompt: {
          phase: "running",
          runStartedAt: startedSecondsAgo(60),
          progressFraction: 0.25
        },
        now
      })
    ).toEqual({
      ETA: 180,
      estimatedEndTime: "2026-09-29T12:03:00.000Z",
      progress: 25
    });
  });

  it("counts from ComfyUI's start, not from submission", () => {
    const eta = comfyRenderEta({
      model: "wan_animate_2_2",
      livePrompt: {
        phase: "running",
        runStartedAt: startedSecondsAgo(10),
        progressFraction: 0.5
      },
      now
    });
    expect(eta.ETA).toBe(10);
  });

  it("falls back to the model estimate below five percent", () => {
    expect(
      comfyRenderEta({
        model: "qwen",
        livePrompt: {
          phase: "running",
          runStartedAt: startedSecondsAgo(12),
          progressFraction: 0.01
        },
        now
      })
    ).toMatchObject({ ETA: 108, progress: 10 });
  });
});
