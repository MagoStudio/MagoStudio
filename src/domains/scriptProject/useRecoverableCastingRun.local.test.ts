import { describe, expect, it } from "vitest";

import { findRecoverableCastingRun } from "./useRecoverableCastingRun.local";

describe("findRecoverableCastingRun", () => {
  it("selects the newest active local casting plan", () => {
    expect(
      findRecoverableCastingRun({
        older: {
          id: "11111111-1111-4111-8111-111111111111",
          local_operation: "cast",
          local_request: { script: "old" },
          status: "PAUSED",
          created_at: "2026-09-18T10:00:00.000Z"
        },
        newest: {
          id: "22222222-2222-4222-8222-222222222222",
          local_operation: "cast",
          local_request: { script: "new" },
          status: "RUNNING",
          created_at: "2026-09-18T11:00:00.000Z"
        },
        sheets: {
          id: "33333333-3333-4333-8333-333333333333",
          local_operation: "sheets",
          local_request: {},
          status: "RUNNING",
          created_at: "2026-09-18T12:00:00.000Z"
        }
      })
    ).toEqual({
      planId: "22222222-2222-4222-8222-222222222222",
      status: "RUNNING"
    });
  });

  it("ignores completed casting plans", () => {
    expect(
      findRecoverableCastingRun({
        completed: {
          id: "11111111-1111-4111-8111-111111111111",
          local_operation: "cast",
          local_request: { script: "done" },
          status: "COMPLETED"
        }
      })
    ).toBeNull();
  });
});
