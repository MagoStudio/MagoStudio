import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildSequentialShotRunOverride } from "./buildSequentialShotRunOverride";

const buildShot = (
  timelineId: string,
  sequential: ShotState["sequential"]
): ShotState => ({
  timeline_id: timelineId,
  shot_index: 0,
  sequence_id: 1,
  dropped: false,
  hidden: false,
  manual: false,
  tags: { characters: [], environments: [], props: [] },
  references: {},
  missing_references: [],
  dialogue_untagged_speakers: [],
  sequential
});

describe("buildSequentialShotRunOverride", () => {
  it("sends nothing when the run is not suspending anything", () => {
    expect(
      buildSequentialShotRunOverride({
        shots: [buildShot("a", { enabled: true, mode: "last_frame" })],
        isSequentialSuspendedForRun: false
      })
    ).toBeUndefined();
  });

  it("sends nothing when no shot is sequential in the first place", () => {
    expect(
      buildSequentialShotRunOverride({
        shots: [
          buildShot("a", null),
          buildShot("b", { enabled: false, mode: "last_frame" })
        ],
        isSequentialSuspendedForRun: true
      })
    ).toBeUndefined();
  });

  it("names every sequential shot per-shot, never as a run default", () => {
    expect(
      buildSequentialShotRunOverride({
        shots: [
          buildShot("a", { enabled: true, mode: "last_frame" }),
          buildShot("b", null),
          buildShot("c", { enabled: true, mode: "key_frames" })
        ],
        isSequentialSuspendedForRun: true
      })
    ).toEqual({ shots: { a: { enabled: false }, c: { enabled: false } } });
  });
});
