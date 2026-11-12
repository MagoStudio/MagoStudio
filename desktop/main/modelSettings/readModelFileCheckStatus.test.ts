import { describe, expect, it } from "vitest";

import { readModelFileCheckStatus } from "./readModelFileCheckStatus";

const currentFile = { size: 10, modified: 20 };
const recorded = (
  action: string,
  status: "success" | "error" | "unknown" = "success",
  fingerprint = currentFile
) => ({
  status,
  message: status,
  details: { action, ...fingerprint }
});

describe("readModelFileCheckStatus", () => {
  it("passes a file whose compatibility check or load test passed", () => {
    for (const action of ["compatibility", "load"])
      expect(
        readModelFileCheckStatus({
          latestCheckResult: recorded(action),
          latestLoadTestResult: undefined,
          currentFile
        }).hasPassedModelCheck
      ).toBe(true);
  });

  it("keeps a failed load test even after a later compatibility pass", () => {
    expect(
      readModelFileCheckStatus({
        latestCheckResult: recorded("compatibility"),
        latestLoadTestResult: recorded("load", "error"),
        currentFile
      })
    ).toEqual({ hasPassedModelCheck: false, loadTestOutcome: "failed" });
  });

  it("reports a passed load test separately", () => {
    expect(
      readModelFileCheckStatus({
        latestCheckResult: recorded("compatibility", "unknown"),
        latestLoadTestResult: recorded("load"),
        currentFile
      })
    ).toEqual({ hasPassedModelCheck: true, loadTestOutcome: "passed" });
  });

  it("ignores results recorded before the file changed", () => {
    const olderFile = { size: 9, modified: 1 };
    expect(
      readModelFileCheckStatus({
        latestCheckResult: recorded("compatibility", "success", olderFile),
        latestLoadTestResult: recorded("load", "error", olderFile),
        currentFile
      })
    ).toEqual({ hasPassedModelCheck: false, loadTestOutcome: "untested" });
  });

  it("ignores hashing and missing records", () => {
    expect(
      readModelFileCheckStatus({
        latestCheckResult: recorded("hash"),
        latestLoadTestResult: undefined,
        currentFile
      }).hasPassedModelCheck
    ).toBe(false);
    expect(
      readModelFileCheckStatus({
        latestCheckResult: undefined,
        latestLoadTestResult: undefined,
        currentFile: null
      })
    ).toEqual({ hasPassedModelCheck: false, loadTestOutcome: "untested" });
  });

  it("does not trust a record when the file cannot be read", () => {
    expect(
      readModelFileCheckStatus({
        latestCheckResult: recorded("compatibility"),
        latestLoadTestResult: recorded("load"),
        currentFile: null
      })
    ).toEqual({ hasPassedModelCheck: false, loadTestOutcome: "untested" });
  });
});
