import {
  DEFAULT_SCRIPT_PROJECT_TAB_ID,
  SCRIPT_PROJECT_TAB_IDS,
  ScriptProjectTabId
} from "../constants";

export const resolveScriptProjectTabId = (
  tabIdCandidate: string | null | undefined
): ScriptProjectTabId =>
  Object.values(SCRIPT_PROJECT_TAB_IDS).find(
    (tabId) => tabId === tabIdCandidate
  ) ?? DEFAULT_SCRIPT_PROJECT_TAB_ID;
