import { BulkRendersRun, BulkRendersRunStatus } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import {
  BULK_RENDERS_RUN_POLL_INTERVAL_MS,
  FAILING_POLL_INTERVAL_MS
} from "../constants";

import {
  BULK_RENDERS_RUN_LIST_MAX_POLLED_ERRORS,
  resolveBulkRendersRunListPollInterval
} from "./resolveBulkRendersRunListPollInterval";

const runWithStatus = (status: BulkRendersRunStatus) =>
  ({ id: `run-${status}`, status }) as BulkRendersRun;

describe("resolveBulkRendersRunListPollInterval", () => {
  it("polls while a run is still unfinished", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: [runWithStatus("COMPLETED"), runWithStatus("RUNNING")]
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });

  it("stops polling once every run is terminal, so an idle Project is left alone", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: [runWithStatus("COMPLETED"), runWithStatus("CANCELLED")]
      })
    ).toBe(false);
  });

  it("stops polling once every unfinished run is paused, because none of them advance on their own", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: [runWithStatus("PAUSED")]
      })
    ).toBe(false);
  });

  it("stops polling when every unfinished run is paused, even alongside a terminal one", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: [runWithStatus("PAUSED"), runWithStatus("COMPLETED")]
      })
    ).toBe(false);
  });

  it("keeps polling while one run is paused and another can still advance", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: [runWithStatus("PAUSED"), runWithStatus("RUNNING")]
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });

  it("stops polling when there are no runs at all", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: false,
        consecutiveFailureCount: 0,
        runs: []
      })
    ).toBe(false);
  });

  it("keeps polling through the first errors, so a transient failure recovers on its own", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: true,
        consecutiveFailureCount: 1,
        runs: undefined
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });

  it("still polls on the last allowed error", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: true,
        consecutiveFailureCount: BULK_RENDERS_RUN_LIST_MAX_POLLED_ERRORS,
        runs: undefined
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });

  it("slows down once the errors are exhausted, so the list recovers without a reload", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: true,
        consecutiveFailureCount: BULK_RENDERS_RUN_LIST_MAX_POLLED_ERRORS + 1,
        runs: undefined
      })
    ).toBe(FAILING_POLL_INTERVAL_MS);
  });

  it("keeps retrying an errored query even when the last good list was all terminal", () => {
    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: true,
        consecutiveFailureCount: 1,
        runs: [runWithStatus("COMPLETED")]
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });

  it("spends the allowance on consecutive failures only, so a recovered query starts over", () => {
    const failureCountAfterRecovery = 1;

    expect(
      resolveBulkRendersRunListPollInterval({
        hasQueryErrored: true,
        consecutiveFailureCount: failureCountAfterRecovery,
        runs: undefined
      })
    ).toBe(BULK_RENDERS_RUN_POLL_INTERVAL_MS);
  });
});
