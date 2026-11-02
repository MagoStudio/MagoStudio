import { describe, expect, it } from "vitest";

import { isBulkRendersRunStatusFailed } from "./isBulkRendersRunStatusFailed";

describe("isBulkRendersRunStatusFailed", () => {
  it("treats a failed run as failed", () => {
    expect(isBulkRendersRunStatusFailed("FAILED")).toBe(true);
  });

  it("treats a cancelled run as failed", () => {
    expect(isBulkRendersRunStatusFailed("CANCELLED")).toBe(true);
  });

  it("does not treat a completed run as failed", () => {
    expect(isBulkRendersRunStatusFailed("COMPLETED")).toBe(false);
  });

  it("does not treat a running run as failed", () => {
    expect(isBulkRendersRunStatusFailed("RUNNING")).toBe(false);
  });

  it("does not treat an unloaded status as failed", () => {
    expect(isBulkRendersRunStatusFailed(undefined)).toBe(false);
  });
});
