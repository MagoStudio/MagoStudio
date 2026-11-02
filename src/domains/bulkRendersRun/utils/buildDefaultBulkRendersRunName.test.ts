import { BULK_RENDERS_RUN_NAME_MAX_LENGTH } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { buildDefaultBulkRendersRunName } from "./buildDefaultBulkRendersRunName";

describe("buildDefaultBulkRendersRunName", () => {
  it("names the run one more than the existing run count", () => {
    const name = buildDefaultBulkRendersRunName({
      existingRunCount: 2,
      projectName: "My film"
    });

    expect(name).toBe("Bulk 3_My film");
  });

  it("starts at 1 for a Project with no existing runs", () => {
    const name = buildDefaultBulkRendersRunName({
      existingRunCount: 0,
      projectName: "My film"
    });

    expect(name).toBe("Bulk 1_My film");
  });

  it("truncates a generated name from the tail, keeping the leading Bulk <n>_ identity intact", () => {
    const name = buildDefaultBulkRendersRunName({
      existingRunCount: 2,
      projectName: "a".repeat(250)
    });

    expect(name).toHaveLength(BULK_RENDERS_RUN_NAME_MAX_LENGTH);
    expect(name.startsWith("Bulk 3_")).toBe(true);
    expect(name).toBe(
      `Bulk 3_${"a".repeat(250)}`.slice(0, BULK_RENDERS_RUN_NAME_MAX_LENGTH)
    );
  });

  it("truncates a non-ASCII project name by code point, never splitting a surrogate pair", () => {
    const surrogatePairEmoji = "🎬";
    const name = buildDefaultBulkRendersRunName({
      existingRunCount: 2,
      projectName: surrogatePairEmoji.repeat(250)
    });

    // oxlint-disable-next-line typescript/no-misused-spread -- asserting the code-point count is exactly the property under test
    expect([...name]).toHaveLength(BULK_RENDERS_RUN_NAME_MAX_LENGTH);
    expect(name.startsWith("Bulk 3_")).toBe(true);
  });
});
