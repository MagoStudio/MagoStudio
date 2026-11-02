import { describe, expect, it } from "vitest";

import { mergePinnedTrackIds } from "./mergePinnedTrackIds";

describe("mergePinnedTrackIds", () => {
  it("returns mine when the cloud has not changed since Local read it", () => {
    const base = { shotA: "track1" };
    const mine = { shotA: "track1", shotB: "track2" };
    expect(mergePinnedTrackIds({ base, mine, theirs: base })).toEqual(mine);
  });

  it("keeps a pin added in the cloud alongside a pin added locally", () => {
    expect(
      mergePinnedTrackIds({
        base: {},
        mine: { shotA: "track1" },
        theirs: { shotB: "track2" }
      })
    ).toEqual({ shotA: "track1", shotB: "track2" });
  });

  it("keeps a cloud unpin of another shot when Local pins a shot", () => {
    expect(
      mergePinnedTrackIds({
        base: { shotA: "track1", shotB: "track2" },
        mine: { shotA: "track1", shotB: "track2", shotC: "track3" },
        theirs: { shotA: "track1" }
      })
    ).toEqual({ shotA: "track1", shotC: "track3" });
  });

  it("removes a shot unpinned locally even if the cloud still pins it", () => {
    expect(
      mergePinnedTrackIds({
        base: { shotA: "track1", shotB: "track2" },
        mine: { shotB: "track2" },
        theirs: { shotA: "track1", shotB: "track2", shotC: "track3" }
      })
    ).toEqual({ shotB: "track2", shotC: "track3" });
  });

  it("stays unpinned when both sides unpinned the same shot", () => {
    expect(
      mergePinnedTrackIds({
        base: { shotA: "track1" },
        mine: {},
        theirs: {}
      })
    ).toEqual({});
  });

  it("applies a local re-pin over a concurrent cloud re-pin of the same shot", () => {
    expect(
      mergePinnedTrackIds({
        base: { shotA: "track1" },
        mine: { shotA: "track2" },
        theirs: { shotA: "track3" }
      })
    ).toEqual({ shotA: "track2" });
  });

  it("follows the cloud for shots Local did not touch", () => {
    expect(
      mergePinnedTrackIds({
        base: { shotA: "track1", shotB: "track2" },
        mine: { shotA: "track9", shotB: "track2" },
        theirs: { shotA: "track1", shotB: "track5" }
      })
    ).toEqual({ shotA: "track9", shotB: "track5" });
  });
});
