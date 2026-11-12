import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { countShotsTaggingEntity } from "./countShotsTaggingEntity";

const shot = (
  sequenceId: number,
  tags: Partial<ShotState["tags"]>
): ShotState => ({
  timeline_id: `timeline-${sequenceId}`,
  shot_index: sequenceId - 1,
  sequence_id: sequenceId,
  heading: null,
  video_prompt: null,
  tags: { characters: [], environments: [], props: [], ...tags },
  references: {},
  missing_references: [],
  dialogue_untagged_speakers: [],
  dropped: false,
  hidden: false,
  manual: false
});

const shots = [
  shot(2, { characters: ["sergeant"], environments: ["colony"] }),
  shot(3, { characters: ["medic"] }),
  shot(4, { characters: ["sergeant"], props: ["rifle"] })
];

describe("countShotsTaggingEntity", () => {
  it("counts every shot that tags the entity", () => {
    expect(countShotsTaggingEntity(shots, "sergeant")).toBe(2);
  });

  it("looks in every tag group, not just characters", () => {
    expect(countShotsTaggingEntity(shots, "colony")).toBe(1);
    expect(countShotsTaggingEntity(shots, "rifle")).toBe(1);
  });

  it("is zero for an entity no shot uses, so no warning is shown", () => {
    expect(countShotsTaggingEntity(shots, "narrator")).toBe(0);
  });

  it("counts a shot once even if it tags the entity in two groups", () => {
    const oddShot = shot(5, { characters: ["ghost"], props: ["ghost"] });
    expect(countShotsTaggingEntity([oddShot], "ghost")).toBe(1);
  });

  it("is zero for a project with no shots yet", () => {
    expect(countShotsTaggingEntity([], "sergeant")).toBe(0);
  });
});
