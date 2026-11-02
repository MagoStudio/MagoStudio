import { BulkRendersRun } from "@schemas/bulkRendersRun";

import { isListableBulkRendersRun } from "./isListableBulkRendersRun";

export interface BulkRendersRunActivityCounts {
  runningRunCount: number;
  waitingRunCount: number;
}

export const countBulkRendersRunsByActivity = (
  runs: BulkRendersRun[]
): BulkRendersRunActivityCounts => {
  const listableRuns = runs.filter(isListableBulkRendersRun);

  return {
    runningRunCount: listableRuns.filter((run) => run.status === "RUNNING")
      .length,
    waitingRunCount: listableRuns.filter((run) => run.status === "PENDING")
      .length
  };
};
