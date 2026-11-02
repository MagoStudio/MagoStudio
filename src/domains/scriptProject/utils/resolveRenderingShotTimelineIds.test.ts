import { describe, expect, it } from "vitest";

import { resolveRenderingShotTimelineIds } from "./resolveRenderingShotTimelineIds";

describe("resolveRenderingShotTimelineIds", () => {
  it("merges the run this tab started with the backend's in-progress list", () => {
    expect(
      resolveRenderingShotTimelineIds({
        renderingShotTimelineIdsFromRun: ["a", "b"],
        inProgressShotTimelineIds: new Set(["b", "c"]),
        failedShotTimelineIds: new Set()
      })
    ).toEqual(new Set(["a", "b", "c"]));
  });

  it("drops a Shot the plan failed even though this tab's run still lists it", () => {
    expect(
      resolveRenderingShotTimelineIds({
        renderingShotTimelineIdsFromRun: ["a", "b"],
        inProgressShotTimelineIds: new Set(["b"]),
        failedShotTimelineIds: new Set(["a"])
      })
    ).toEqual(new Set(["b"]));
  });

  it("keeps a Shot another plan is rendering again after an older plan failed it", () => {
    expect(
      resolveRenderingShotTimelineIds({
        renderingShotTimelineIdsFromRun: ["a"],
        inProgressShotTimelineIds: new Set(["a"]),
        failedShotTimelineIds: new Set(["a"])
      })
    ).toEqual(new Set(["a"]));
  });
});
