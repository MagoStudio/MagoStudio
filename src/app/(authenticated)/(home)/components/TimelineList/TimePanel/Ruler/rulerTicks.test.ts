import { describe, expect, it } from "vitest";

import { generateRulerTicks, getRulerUnitMode } from "./rulerTicks";

describe("rulerTicks", () => {
  it("uses frames mode for long clips", () => {
    const mode = getRulerUnitMode({ durationFrames: 48, fps: 24 });
    expect(mode).toBe("frames");
  });

  it("uses frames mode for short clips", () => {
    const mode = getRulerUnitMode({ durationFrames: 24, fps: 24 });
    expect(mode).toBe("frames");
  });

  it("generates major ticks in seconds with a 10s step for ~100s", () => {
    const ticks = generateRulerTicks({
      durationFrames: 2400,
      fps: 24,
      widthPx: 520,
      mode: "seconds"
    });

    const majorLabels = ticks
      .filter((t) => t.kind === "major" && t.label)
      .map((t) => t.label);

    expect(majorLabels).toContain("0");
    expect(majorLabels).toContain("10");
    expect(majorLabels).toContain("100");
  });

  it("generates major ticks in frames and omits the exact end frame when it's not on a major boundary", () => {
    const ticks = generateRulerTicks({
      durationFrames: 24,
      fps: 24,
      widthPx: 520,
      mode: "frames"
    });

    const majorFrames = ticks
      .filter((t) => t.kind === "major")
      .map((t) => t.frame);
    expect(majorFrames[0]).toBe(0);
    expect(majorFrames[majorFrames.length - 1]).toBe(20);
    expect(majorFrames).not.toContain(24);
  });
});
