import { describe, expect, it } from "vitest";

import { bulkRendersRunSteps } from "./bulkRendersRun";

describe("bulkRendersRun query keys", () => {
  it("changes the steps key when the run settles, so the run going terminal buys one more fetch", () => {
    expect(bulkRendersRunSteps.byRunIdWhileActive("run-1", true)).not.toEqual(
      bulkRendersRunSteps.byRunIdWhileActive("run-1", false)
    );
  });

  it("keeps both activity states prefixed by the run key, so invalidating the run id reaches both", () => {
    const runKey = bulkRendersRunSteps.byRunId("run-1");

    for (const isRunActive of [true, false]) {
      expect(
        bulkRendersRunSteps
          .byRunIdWhileActive("run-1", isRunActive)
          .slice(0, runKey.length)
      ).toEqual(runKey);
    }
  });
});
