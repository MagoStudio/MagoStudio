import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { isBulkRendersRunStatusTerminal } from "./isBulkRendersRunStatusTerminal";

describe("isBulkRendersRunStatusTerminal", () => {
  it.each<BulkRendersRunStatus>(["COMPLETED", "FAILED", "CANCELLED"])(
    "treats %s as terminal",
    (status) => {
      expect(isBulkRendersRunStatusTerminal(status)).toBe(true);
    }
  );

  it.each<BulkRendersRunStatus>(["PENDING", "RUNNING", "PAUSED"])(
    "treats %s as non-terminal so polling continues",
    (status) => {
      expect(isBulkRendersRunStatusTerminal(status)).toBe(false);
    }
  );

  it("defaults an unrecognised status to non-terminal (keep polling) rather than silently stopping — note that BulkRendersRunStatusSchema's strict z.enum already rejects an unknown status before this predicate is ever reached in production, so this only documents the predicate's own fallback behaviour", () => {
    const unrecognisedStatus =
      "SOME_FUTURE_STATUS" as unknown as BulkRendersRunStatus;

    expect(isBulkRendersRunStatusTerminal(unrecognisedStatus)).toBe(false);
  });
});
