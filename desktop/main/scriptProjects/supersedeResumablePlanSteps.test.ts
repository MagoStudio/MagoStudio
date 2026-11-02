import { describe, expect, it } from "vitest";

import { supersedeResumablePlanSteps } from "./supersedeResumablePlanSteps";

const step = (id: string, token: string, status: string) => ({
  id,
  status,
  tool_args: { token }
});

const isStepForMara = (candidate: Record<string, unknown>) =>
  (candidate.tool_args as { token?: string }).token === "mara";

describe("supersedeResumablePlanSteps", () => {
  it("skips the unfinished steps of the superseded items and keeps the rest", () => {
    const steps = supersedeResumablePlanSteps({
      plan: {
        status: "PAUSED",
        steps: [
          step("submit-mara", "mara", "COMPLETED"),
          step("poll-mara", "mara", "FAILED"),
          step("submit-harbour", "harbour", "PENDING")
        ]
      },
      isStepForSupersededItem: isStepForMara,
      supersedingPlanId: "plan-2",
      supersededAt: "2026-10-15T10:00:00.000Z"
    });

    expect(steps).toEqual([
      step("submit-mara", "mara", "COMPLETED"),
      {
        ...step("poll-mara", "mara", "SKIPPED"),
        finished_at: "2026-10-15T10:00:00.000Z",
        error: null,
        result: { reason: "superseded", superseded_by: "plan-2" }
      },
      step("submit-harbour", "harbour", "PENDING")
    ]);
  });

  it("supersedes steps of a failed plan, which can also be resumed", () => {
    expect(
      supersedeResumablePlanSteps({
        plan: {
          status: "FAILED",
          steps: [step("poll-mara", "mara", "FAILED")]
        },
        isStepForSupersededItem: isStepForMara,
        supersedingPlanId: "plan-2",
        supersededAt: "2026-10-15T10:00:00.000Z"
      })?.[0]?.status
    ).toBe("SKIPPED");
  });

  it("leaves a plan that cannot be resumed, or holds none of the items, untouched", () => {
    for (const status of ["RUNNING", "PENDING", "COMPLETED", "CANCELLED"])
      expect(
        supersedeResumablePlanSteps({
          plan: { status, steps: [step("poll-mara", "mara", "PENDING")] },
          isStepForSupersededItem: isStepForMara,
          supersedingPlanId: "plan-2",
          supersededAt: "2026-10-15T10:00:00.000Z"
        })
      ).toBeNull();
    expect(
      supersedeResumablePlanSteps({
        plan: {
          status: "PAUSED",
          steps: [step("poll-harbour", "harbour", "PENDING")]
        },
        isStepForSupersededItem: isStepForMara,
        supersedingPlanId: "plan-2",
        supersededAt: "2026-10-15T10:00:00.000Z"
      })
    ).toBeNull();
  });
});
