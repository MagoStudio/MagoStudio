import { describe, expect, it } from "vitest";

import { isLocallyRunPlan } from "./isLocallyRunPlan";

describe("isLocallyRunPlan", () => {
  it("is true for a plan the desktop created and runs", () => {
    expect(isLocallyRunPlan({ id: "plan-1", local_operation: "cast" })).toBe(
      true
    );
  });

  it("is false for a cloud plan mirrored into a snapshot", () => {
    expect(
      isLocallyRunPlan({
        id: "plan-1",
        status: "RUNNING",
        input_data: { project_id: "project-1" }
      })
    ).toBe(false);
  });

  it("is false when there is no plan", () => {
    expect(isLocallyRunPlan(null)).toBe(false);
    expect(isLocallyRunPlan(undefined)).toBe(false);
  });
});
