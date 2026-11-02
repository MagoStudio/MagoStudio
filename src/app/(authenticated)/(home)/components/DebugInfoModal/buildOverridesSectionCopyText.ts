interface OverridesSectionData {
  subscriptionOverride: string | null;
  isLegacyUserOverride: boolean;
  createdAtOverride: string | null;
  forceNonTeamMemberOverride: boolean;
  mockOnboardingIncompleteOverride: boolean;
  forceOnboardingCompleteOverride: boolean;
  forceOnboardingEnabledOverride: boolean;
  relaxedDayUsedPctOverride: number | null;
  relaxedDayResetAtOverride: string | null;
  relaxedWeekUsedPctOverride: number | null;
  relaxedWeekResetAtOverride: string | null;
}

export function buildOverridesSectionCopyText(
  t: (key: string) => string,
  {
    subscriptionOverride,
    isLegacyUserOverride,
    createdAtOverride,
    forceNonTeamMemberOverride,
    mockOnboardingIncompleteOverride,
    forceOnboardingCompleteOverride,
    forceOnboardingEnabledOverride,
    relaxedDayUsedPctOverride,
    relaxedDayResetAtOverride,
    relaxedWeekUsedPctOverride,
    relaxedWeekResetAtOverride
  }: OverridesSectionData
): string {
  return [
    `## ${t("titles.dev_overrides.label")}`,
    `${t("titles.subscription_override.label")}: ${subscriptionOverride ?? "None"}`,
    `${t("titles.legacy_user_override.label")}: ${isLegacyUserOverride}`,
    `${t("titles.created_at_override.label")}: ${createdAtOverride ?? "None"}`,
    `${t("titles.force_non_team_member_override.label")}: ${forceNonTeamMemberOverride}`,
    `${t("titles.mock_onboarding_incomplete_override.label")}: ${mockOnboardingIncompleteOverride}`,
    `${t("titles.force_onboarding_complete_override.label")}: ${forceOnboardingCompleteOverride}`,
    `${t("titles.force_onboarding_enabled_override.label")}: ${forceOnboardingEnabledOverride}`,
    `${t("titles.relaxed_day_pct_override.label")}: ${relaxedDayUsedPctOverride ?? "None"}`,
    `${t("titles.relaxed_day_reset_override.label")}: ${relaxedDayResetAtOverride ?? "None"}`,
    `${t("titles.relaxed_week_pct_override.label")}: ${relaxedWeekUsedPctOverride ?? "None"}`,
    `${t("titles.relaxed_week_reset_override.label")}: ${relaxedWeekResetAtOverride ?? "None"}`
  ].join("\n");
}
