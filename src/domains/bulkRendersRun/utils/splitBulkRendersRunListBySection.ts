import { BulkRendersRun } from "@schemas/bulkRendersRun";

import { isBulkRendersRunStatusTerminal } from "./isBulkRendersRunStatusTerminal";
import { isListableBulkRendersRun } from "./isListableBulkRendersRun";

export interface BulkRendersRunListSections {
  inProgressRuns: BulkRendersRun[];
  historyRuns: BulkRendersRun[];
}

export const splitBulkRendersRunListBySection = ({
  runs
}: {
  runs: BulkRendersRun[];
}): BulkRendersRunListSections => {
  const listableRuns = runs.filter(isListableBulkRendersRun);

  const inProgressRuns = listableRuns.filter(
    (run) => !isBulkRendersRunStatusTerminal(run.status)
  );

  const historyRuns = listableRuns
    .filter((run) => isBulkRendersRunStatusTerminal(run.status))
    .sort((firstRun, secondRun) =>
      (secondRun.created_at ?? "").localeCompare(firstRun.created_at ?? "")
    );

  return { inProgressRuns, historyRuns };
};
