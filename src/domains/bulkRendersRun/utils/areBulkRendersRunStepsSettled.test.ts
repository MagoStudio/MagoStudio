import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { areBulkRendersRunStepsSettled } from "./areBulkRendersRunStepsSettled";

const step = (status: string): BulkRendersRunStep =>
  ({ status }) as unknown as BulkRendersRunStep;

describe("areBulkRendersRunStepsSettled", () => {
  it("is settled when every step reached a terminal status", () => {
    expect(
      areBulkRendersRunStepsSettled([
        step("COMPLETED"),
        step("SKIPPED"),
        step("FAILED")
      ])
    ).toBe(true);
  });

  it("is unsettled while a step is still running", () => {
    expect(
      areBulkRendersRunStepsSettled([step("COMPLETED"), step("RUNNING")])
    ).toBe(false);
  });

  it("is unsettled while a step is still pending", () => {
    expect(
      areBulkRendersRunStepsSettled([step("COMPLETED"), step("PENDING")])
    ).toBe(false);
  });

  it("is unsettled when the steps have not loaded", () => {
    expect(areBulkRendersRunStepsSettled(undefined)).toBe(false);
  });

  it("is unsettled for an empty list, which means nothing was read", () => {
    expect(areBulkRendersRunStepsSettled([])).toBe(false);
  });
});
