import { describe, expect, it } from "vitest";

import { mergeMirroredPlanDetails } from "./mergeMirroredPlanDetails";

describe("mergeMirroredPlanDetails", () => {
  it("prefers a freshly fetched plan over its cached copy", () => {
    expect(
      mergeMirroredPlanDetails({
        listedPlanIds: ["plan-a"],
        fetchedPlanDetails: { "plan-a": { status: "fresh" } },
        cachedPlanDetails: { "plan-a": { status: "cached" } }
      })
    ).toEqual({ "plan-a": { status: "fresh" } });
  });

  it("keeps the cached copy of a listed plan that could not be fetched", () => {
    expect(
      mergeMirroredPlanDetails({
        listedPlanIds: ["plan-a", "plan-b"],
        fetchedPlanDetails: { "plan-b": { status: "fresh" } },
        cachedPlanDetails: { "plan-a": { status: "cached" } }
      })
    ).toEqual({
      "plan-a": { status: "cached" },
      "plan-b": { status: "fresh" }
    });
  });

  it("drops cached plans the listing no longer references", () => {
    expect(
      mergeMirroredPlanDetails({
        listedPlanIds: ["plan-a"],
        fetchedPlanDetails: {},
        cachedPlanDetails: {
          "plan-a": { status: "cached" },
          "plan-deleted": { status: "cached" }
        }
      })
    ).toEqual({ "plan-a": { status: "cached" } });
  });

  it("omits a listed plan that was neither fetched nor cached", () => {
    expect(
      mergeMirroredPlanDetails({
        listedPlanIds: ["plan-a"],
        fetchedPlanDetails: {},
        cachedPlanDetails: null
      })
    ).toEqual({});
  });
});
