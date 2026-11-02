import { ScriptVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { hasUsableScriptVersion } from "./hasUsableScriptVersion";

const versionWithStatus = (status: string | null): ScriptVersion => ({
  version: 1,
  plan_id: "plan-1",
  created_at: "2026-09-05T10:00:00Z",
  max_shots: 30,
  status,
  summary: null
});

describe("hasUsableScriptVersion", () => {
  it("is false before anything has been cast", () => {
    expect(hasUsableScriptVersion(undefined)).toBe(false);
    expect(hasUsableScriptVersion({ versions: [] })).toBe(false);
  });

  it("is true while a cast is still running", () => {
    expect(
      hasUsableScriptVersion({ versions: [versionWithStatus("PENDING")] })
    ).toBe(true);
    expect(
      hasUsableScriptVersion({ versions: [versionWithStatus("RUNNING")] })
    ).toBe(true);
  });

  it("is true once a cast has succeeded", () => {
    expect(
      hasUsableScriptVersion({ versions: [versionWithStatus("COMPLETED")] })
    ).toBe(true);
  });

  it("is false when every cast failed, so the script can be sent again", () => {
    expect(
      hasUsableScriptVersion({ versions: [versionWithStatus("FAILED")] })
    ).toBe(false);
    expect(
      hasUsableScriptVersion({ versions: [versionWithStatus("CANCELLED")] })
    ).toBe(false);
    expect(
      hasUsableScriptVersion({
        versions: [versionWithStatus("FAILED"), versionWithStatus("CANCELLED")]
      })
    ).toBe(false);
  });

  it("trusts an active version even when its plan status is gone", () => {
    expect(
      hasUsableScriptVersion({
        active_version: 1,
        versions: [versionWithStatus("UNKNOWN")]
      })
    ).toBe(true);
  });

  it("is true when an earlier cast succeeded and a later one failed", () => {
    expect(
      hasUsableScriptVersion({
        versions: [versionWithStatus("COMPLETED"), versionWithStatus("FAILED")]
      })
    ).toBe(true);
  });
});
