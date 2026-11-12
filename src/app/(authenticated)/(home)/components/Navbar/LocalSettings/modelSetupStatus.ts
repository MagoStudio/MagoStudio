import type { ModelSettingsSnapshot } from "../../../../../../../desktop/shared/modelSettings";

export const componentSetupStatus = (
  component: ModelSettingsSnapshot["components"][number]
): boolean | null => {
  if (
    component.problem &&
    ["error", "mismatch", "unsupported"].includes(component.problem.status)
  )
    return false;
  if (component.status === "missing") return false;
  return component.status === "installed" ? true : null;
};

export const modelSetupStatus = (
  snapshot?: ModelSettingsSnapshot
): boolean | null => {
  if (!snapshot) return null;
  if (
    snapshot.components.some(
      ({ problem }) =>
        problem && ["error", "mismatch", "unsupported"].includes(problem.status)
    )
  )
    return false;
  if (!snapshot.available) return snapshot.model === "minimax" ? false : null;
  const main = snapshot.components.find(({ role }) => role === "main");
  if (snapshot.model !== "minimax" && main?.status === "missing") return null;
  if (
    !snapshot.loadersAvailable ||
    snapshot.missingWorkflowNodes.length > 0 ||
    snapshot.isLlamaCppPackageInstalled === false ||
    snapshot.components.some(({ status }) => status === "missing")
  )
    return false;
  return snapshot.components.length > 0 &&
    snapshot.components.every(({ status }) => status === "installed")
    ? true
    : null;
};
