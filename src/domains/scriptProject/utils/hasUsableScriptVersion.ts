import { ScriptVersionList } from "@schemas/scriptProject";

import { hasUnsettledScriptVersion } from "./hasUnsettledScriptVersion";

const SUCCEEDED_CASTING_STATUS = "COMPLETED";

export const hasUsableScriptVersion = (
  versionList: ScriptVersionList | undefined
): boolean => {
  const versions = versionList?.versions ?? [];

  if (hasUnsettledScriptVersion(versions)) return true;
  if (versionList?.active_version != null) return true;

  return versions.some(
    (version) => version.status === SUCCEEDED_CASTING_STATUS
  );
};
