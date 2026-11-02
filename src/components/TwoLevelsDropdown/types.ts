interface TwoLevelsDropdownItem {
  key: string;
  label: string;
  description?: string;
  badge?: string;
  /** Where the item will run, shown alongside the badge. */
  providerBadge?: string;
  /**
   * Shown but not selectable. Used for models that exist yet cannot run in the
   * current state, so the menu stays an honest inventory instead of quietly
   * omitting them.
   */
  isDisabled?: boolean;
  /** Replaces the description while disabled, to say why. */
  disabledReason?: string;
}

export interface TwoLevelsDropdownCategory {
  key: string;
  label: string;
  items: TwoLevelsDropdownItem[];
}
