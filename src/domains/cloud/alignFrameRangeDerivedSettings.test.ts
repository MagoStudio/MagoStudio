import { describe, expect, it } from "vitest";

import { alignFrameRangeDerivedSettings } from "./alignFrameRangeDerivedSettings";

describe("alignFrameRangeDerivedSettings", () => {
  it("recomputes the duration fields from the frame range the way the model builders do", () => {
    expect(
      alignFrameRangeDerivedSettings(
        {
          prompt: "a cat",
          durationInSeconds: 76 / 24,
          frameRangeSeconds: [0, 75 / 24],
          offsetInSeconds: 0
        },
        [12, 74],
        24
      )
    ).toEqual({
      prompt: "a cat",
      durationInSeconds: 63 / 24,
      frameRangeSeconds: [12 / 24, 74 / 24],
      offsetInSeconds: 12 / 24
    });
  });

  it("replaces the requested frame range with the clamped one", () => {
    expect(
      alignFrameRangeDerivedSettings(
        { mago_engine: "v8.0.0", frame_range: [0, 75] },
        [0, 74],
        24
      )
    ).toEqual({ mago_engine: "v8.0.0", frame_range: [0, 74] });
  });

  it("adds no duration field the model did not send", () => {
    expect(
      alignFrameRangeDerivedSettings(
        { mago_engine: "v8.0.0", resolution: 700 },
        [0, 74],
        24
      )
    ).toEqual({ mago_engine: "v8.0.0", resolution: 700 });
  });

  it("satisfies prod's frame_range against durationInSeconds * fps check", () => {
    const fps = 30;
    const frameRange: [number, number] = [5, 149];
    const aligned = alignFrameRangeDerivedSettings(
      { durationInSeconds: 10 },
      frameRange,
      fps
    );
    const backendFrameRangeMismatch = Math.abs(
      frameRange[1] -
        frameRange[0] -
        Math.round((aligned.durationInSeconds as number) * fps)
    );

    expect(backendFrameRangeMismatch).toBeLessThanOrEqual(1);
  });
});
