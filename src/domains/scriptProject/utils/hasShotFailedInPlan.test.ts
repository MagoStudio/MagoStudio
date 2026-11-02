import { CutShot } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { hasShotFailedInPlan } from "./hasShotFailedInPlan";

const cutShot = (versionStatuses: string[]): CutShot =>
  ({
    timeline_id: "shot-12",
    sequence_id: 8,
    versions: versionStatuses.map((status, index) => ({
      layer_id: `layer-${index}`,
      status,
      ready: status === "finished"
    }))
  }) as unknown as CutShot;

describe("hasShotFailedInPlan", () => {
  it("is true for a branch that died before creating a Render Track", () => {
    expect(
      hasShotFailedInPlan({ cutShot: undefined, hasFailedPlanStep: true })
    ).toBe(true);
  });

  it("is true when the Shot is in the cut but carries no version", () => {
    expect(
      hasShotFailedInPlan({ cutShot: cutShot([]), hasFailedPlanStep: true })
    ).toBe(true);
  });

  it("is false when a version landed and a later step failed instead", () => {
    expect(
      hasShotFailedInPlan({
        cutShot: cutShot(["finished"]),
        hasFailedPlanStep: true
      })
    ).toBe(false);
  });

  it("is false when the plan has not failed on this Shot", () => {
    expect(
      hasShotFailedInPlan({ cutShot: undefined, hasFailedPlanStep: false })
    ).toBe(false);
  });
});
