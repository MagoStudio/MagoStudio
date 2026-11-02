import { ScriptVersion } from "@schemas/scriptProject";

const ACTIVE_CASTING_STATUSES = new Set(["PENDING", "RUNNING"]);

export const hasUnsettledScriptVersion = (
  versions: ScriptVersion[] | undefined
): boolean =>
  (versions ?? []).some((version) =>
    ACTIVE_CASTING_STATUSES.has(version.status ?? "")
  );
