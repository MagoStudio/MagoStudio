import { ScriptVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { hasUnsettledScriptVersion } from "./hasUnsettledScriptVersion";

const versionWithStatus = (status: string | null): ScriptVersion => ({
  version: 1,
  plan_id: "plan-1",
  created_at: "2026-09-05T10:00:00Z",
  max_shots: 30,
  status,
  summary: null
});

describe("hasUnsettledScriptVersion", () => {
  it("is false when there are no versions", () => {
    expect(hasUnsettledScriptVersion(undefined)).toBe(false);
    expect(hasUnsettledScriptVersion([])).toBe(false);
  });

  it("is false when every version has settled", () => {
    expect(
      hasUnsettledScriptVersion([
        versionWithStatus("COMPLETED"),
        versionWithStatus("FAILED"),
        versionWithStatus("CANCELLED")
      ])
    ).toBe(false);
  });

  it("is true while a casting run is still going", () => {
    expect(
      hasUnsettledScriptVersion([
        versionWithStatus("COMPLETED"),
        versionWithStatus("RUNNING")
      ])
    ).toBe(true);
    expect(hasUnsettledScriptVersion([versionWithStatus("PENDING")])).toBe(
      true
    );
  });

  it("treats a missing status as settled, so one status-less version cannot poll forever", () => {
    expect(hasUnsettledScriptVersion([versionWithStatus(null)])).toBe(false);
  });

  it("treats a status it does not recognise as settled, for the same reason", () => {
    expect(
      hasUnsettledScriptVersion([versionWithStatus("SOMETHING_NEW")])
    ).toBe(false);
  });
});
