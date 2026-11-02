import { describe, expect, it } from "vitest";

import { packedBreakdownShots, type Beat } from "./sequenceGeneration";

const beat = (key: string, sequenceId: number, shortS: number): Beat => ({
  key,
  sequence_id: sequenceId,
  heading: `SCENE ${sequenceId}`,
  action: `beat ${key} happens`,
  video_prompt: `Prompt for ${key}`,
  character_tokens: ["amara"],
  environment_tokens: ["kitchen"],
  prop_tokens: [],
  dialogue: [],
  camera: null,
  beat_type: null,
  needs_previous_frame: false,
  duration_short_s: shortS,
  duration_long_s: shortS + 1
});

const fourShortSequences = [1, 2, 3, 4].map((sequenceId) =>
  beat(`${sequenceId}.1`, sequenceId, 2)
);

const keysOf = (shots: Beat[], target?: unknown): unknown[] =>
  packedBreakdownShots(shots, null, target as number | null)[0].map(
    (shot) => shot.key
  );

describe("packedBreakdownShots target length", () => {
  it("reports the planned total as the rounded sum of the packed lengths", () => {
    const [packed, , plannedTotalS] = packedBreakdownShots(fourShortSequences);
    expect(plannedTotalS).toBe(
      packed.reduce((sum, shot) => sum + (shot.duration_short_s ?? 0), 0)
    );
    expect(plannedTotalS).toBe(20);
  });

  it("is byte-identical without a target", () => {
    expect(packedBreakdownShots(fourShortSequences, null, null)).toEqual(
      packedBreakdownShots(fourShortSequences)
    );
  });

  it("leaves the grouping alone when the cut already fits", () => {
    expect(keysOf(fourShortSequences, 10_000)).toEqual(
      keysOf(fourShortSequences)
    );
  });

  it.each(["30", 0, -5, null, true, Number.NaN])(
    "ignores the invalid target %s",
    (target) => {
      expect(keysOf(fourShortSequences, target)).toEqual(
        keysOf(fourShortSequences)
      );
    }
  );

  it("never merges floor-padded scenes across sequences to reach the target", () => {
    const [packed, , plannedTotalS] = packedBreakdownShots(
      fourShortSequences,
      null,
      1
    );
    expect(packed).toHaveLength(4);
    expect(plannedTotalS).toBe(20);
  });
});
