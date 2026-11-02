import { describe, expect, it } from "vitest";

import { comfyProgressPercent } from "./comfyProgressPercent";

const now = new Date("2026-09-29T12:00:00.000Z");

describe("comfyProgressPercent", () => {
  it("caps at 99 until the output is saved", () => {
    expect(
      comfyProgressPercent({
        phase: "settled",
        runStartedAt: now,
        progressFraction: 1
      })
    ).toBe(99);
  });
});
