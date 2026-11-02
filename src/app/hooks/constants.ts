export type UserLocalStorageProjectSettings = {
  rangeMin?: number;
  rangeMax?: number;
};

export interface UserLocalStorage {
  copiedRenderSettingsAndEngine:
    | {
        renderEngine: "magov2";
        settings: any;
      }
    | undefined;
  pastDueDismissed?: boolean;
  unlimitedAlertDismissedTime?: number | null;
  mobileWarningDismissed?: boolean;
  appSidebarCollapsed?: boolean;
}

export const defaultUserLocalStorage: UserLocalStorage = {
  copiedRenderSettingsAndEngine: undefined,
  pastDueDismissed: false,
  unlimitedAlertDismissedTime: null,
  mobileWarningDismissed: false,
  appSidebarCollapsed: false
};
