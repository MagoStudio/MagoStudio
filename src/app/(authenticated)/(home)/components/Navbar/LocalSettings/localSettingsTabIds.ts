export const LOCAL_SETTINGS_TAB_IDS = {
  account: "account",
  models: "models",
  general: "general"
} as const;

export type LocalSettingsTabId =
  (typeof LOCAL_SETTINGS_TAB_IDS)[keyof typeof LOCAL_SETTINGS_TAB_IDS];
