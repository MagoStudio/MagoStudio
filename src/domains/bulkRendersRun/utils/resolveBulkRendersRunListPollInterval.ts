import { BulkRendersRun } from "@schemas/bulkRendersRun";

import { BULK_RENDERS_RUN_POLL_INTERVAL_MS } from "../constants";

import { isBulkRendersRunStatusTerminal } from "./isBulkRendersRunStatusTerminal";

export const BULK_RENDERS_RUN_LIST_MAX_POLLED_ERRORS = 3;

export const resolveBulkRendersRunListPollInterval = ({
  hasQueryErrored,
  consecutiveFailureCount,
  runs
}: {
  hasQueryErrored: boolean;
  consecutiveFailureCount: number;
  runs: BulkRendersRun[] | undefined;
}): number | false => {
  if (hasQueryErrored) {
    const hasExhaustedPolledErrors =
      consecutiveFailureCount > BULK_RENDERS_RUN_LIST_MAX_POLLED_ERRORS;
    return hasExhaustedPolledErrors ? false : BULK_RENDERS_RUN_POLL_INTERVAL_MS;
  }

  const hasRunThatCanAdvance = (runs ?? []).some(
    (run) =>
      !isBulkRendersRunStatusTerminal(run.status) && run.status !== "PAUSED"
  );
  return hasRunThatCanAdvance ? BULK_RENDERS_RUN_POLL_INTERVAL_MS : false;
};
