import type { LocalModelGroupId } from "../../../../desktop/shared/localModelGroups";

const HANDOFF_STORAGE_KEY = "mago.localSetupWizard.openOnNextLaunch";
export const OPEN_LOCAL_SETUP_EVENT = "mago:open-local-setup";

export const requestLocalSetupWizardOnNextLaunch = (): void => {
  try {
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, "true");
  } catch {
    return;
  }
};

export const consumeLocalSetupWizardRequest = (): boolean => {
  try {
    const wasRequested =
      window.localStorage.getItem(HANDOFF_STORAGE_KEY) === "true";
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
    return wasRequested;
  } catch {
    return false;
  }
};

export type LocalSetupOpenRequest =
  | {
      kind: "update-installation";
      preselectedModelGroupIds: LocalModelGroupId[];
    }
  | { kind: "manual-download" };

const isLocalSetupOpenRequest = (
  detail: unknown
): detail is LocalSetupOpenRequest =>
  typeof detail === "object" &&
  detail !== null &&
  "kind" in detail &&
  (detail.kind === "update-installation" || detail.kind === "manual-download");

export const readLocalSetupOpenRequest = (
  event: Event
): LocalSetupOpenRequest | null =>
  event instanceof CustomEvent && isLocalSetupOpenRequest(event.detail)
    ? event.detail
    : null;
