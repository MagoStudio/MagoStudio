export const LOCAL_SETTINGS_TAB_IDS = {
  account: "account",
  general: "general",
  models: "models",
  debug: "debug"
} as const;

export type LocalSettingsTabId =
  (typeof LOCAL_SETTINGS_TAB_IDS)[keyof typeof LOCAL_SETTINGS_TAB_IDS];
