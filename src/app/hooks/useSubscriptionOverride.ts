"use client";

import { FORCE_ONBOARDING_ENABLED_KEY } from "@hooks/userLocalStorage/useForceOnboardingEnabled";
import { useIsRawTeamMember } from "@hooks/userLocalStorage/useIsRawTeamMember";
import { SubscriptionType } from "@schemas/balance";
import { useLocalStorage } from "usehooks-ts";

const SUBSCRIPTION_KEY = "mago_dev_subscription_override";
const LEGACY_USER_KEY = "mago_dev_legacy_user_override";
const CREATED_AT_OVERRIDE_KEY = "mago_dev_created_at_override";
const FORCE_NON_TEAM_MEMBER_KEY = "mago_dev_force_non_team_member_override";
const MOCK_ONBOARDING_INCOMPLETE_KEY = "mago_dev_mock_onboarding_incomplete";
const FORCE_ONBOARDING_COMPLETE_KEY = "mago_dev_force_onboarding_complete";
const ONBOARDING_RESET_BASELINE_KEY = "mago_dev_onboarding_reset_baseline";
const RELAXED_DAY_PCT_KEY = "mago_dev_relaxed_day_pct_override";
const RELAXED_DAY_RESET_KEY = "mago_dev_relaxed_day_reset_override";
const RELAXED_WEEK_PCT_KEY = "mago_dev_relaxed_week_pct_override";
const RELAXED_WEEK_RESET_KEY = "mago_dev_relaxed_week_reset_override";

interface SubscriptionOverride {
  subscriptionOverride: SubscriptionType | null;
  setSubscriptionOverride: (type: SubscriptionType | null) => void;
  isLegacyUserOverride: boolean;
  setIsLegacyUserOverride: (value: boolean) => void;
  createdAtOverride: string | null;
  setCreatedAtOverride: (value: string | null) => void;
  forceNonTeamMemberOverride: boolean;
  setForceNonTeamMemberOverride: (value: boolean) => void;
  mockOnboardingIncompleteOverride: boolean;
  setMockOnboardingIncompleteOverride: (value: boolean) => void;
  forceOnboardingCompleteOverride: boolean;
  setForceOnboardingCompleteOverride: (value: boolean) => void;
  forceOnboardingEnabledOverride: boolean;
  setForceOnboardingEnabledOverride: (value: boolean) => void;
  onboardingResetBaseline: string[];
  setOnboardingResetBaseline: (value: string[]) => void;
  relaxedDayUsedPctOverride: number | null;
  setRelaxedDayUsedPctOverride: (value: number | null) => void;
  relaxedDayResetAtOverride: string | null;
  setRelaxedDayResetAtOverride: (value: string | null) => void;
  relaxedWeekUsedPctOverride: number | null;
  setRelaxedWeekUsedPctOverride: (value: number | null) => void;
  relaxedWeekResetAtOverride: string | null;
  setRelaxedWeekResetAtOverride: (value: string | null) => void;
}

export const useSubscriptionOverride = (): SubscriptionOverride => {
  const isRawTeamMember = useIsRawTeamMember();

  const [subscriptionOverride, setSubscriptionOverrideRaw] =
    useLocalStorage<SubscriptionType | null>(SUBSCRIPTION_KEY, null);

  const [isLegacyUserOverride, setIsLegacyUserOverrideRaw] =
    useLocalStorage<boolean>(LEGACY_USER_KEY, false);

  const [createdAtOverride, setCreatedAtOverrideRaw] = useLocalStorage<
    string | null
  >(CREATED_AT_OVERRIDE_KEY, null);

  const [forceNonTeamMemberOverride, setForceNonTeamMemberOverrideRaw] =
    useLocalStorage<boolean>(FORCE_NON_TEAM_MEMBER_KEY, false);

  const [mockOnboardingIncompleteOverride, setMockOnboardingIncompleteRaw] =
    useLocalStorage<boolean>(MOCK_ONBOARDING_INCOMPLETE_KEY, false);

  const [forceOnboardingCompleteOverride, setForceOnboardingCompleteRaw] =
    useLocalStorage<boolean>(FORCE_ONBOARDING_COMPLETE_KEY, false);

  const [forceOnboardingEnabledOverride, setForceOnboardingEnabledRaw] =
    useLocalStorage<boolean>(FORCE_ONBOARDING_ENABLED_KEY, false);

  const [onboardingResetBaseline, setOnboardingResetBaselineRaw] =
    useLocalStorage<string[]>(ONBOARDING_RESET_BASELINE_KEY, []);

  const [relaxedDayUsedPctOverride, setRelaxedDayUsedPctOverrideRaw] =
    useLocalStorage<number | null>(RELAXED_DAY_PCT_KEY, null);

  const [relaxedDayResetAtOverride, setRelaxedDayResetAtOverrideRaw] =
    useLocalStorage<string | null>(RELAXED_DAY_RESET_KEY, null);

  const [relaxedWeekUsedPctOverride, setRelaxedWeekUsedPctOverrideRaw] =
    useLocalStorage<number | null>(RELAXED_WEEK_PCT_KEY, null);

  const [relaxedWeekResetAtOverride, setRelaxedWeekResetAtOverrideRaw] =
    useLocalStorage<string | null>(RELAXED_WEEK_RESET_KEY, null);

  const setSubscriptionOverride = (type: SubscriptionType | null) => {
    if (!isRawTeamMember) return;
    setSubscriptionOverrideRaw(type);
  };
  const setIsLegacyUserOverride = (value: boolean) => {
    if (!isRawTeamMember) return;
    setIsLegacyUserOverrideRaw(value);
  };
  const setCreatedAtOverride = (value: string | null) => {
    if (!isRawTeamMember) return;
    setCreatedAtOverrideRaw(value);
  };
  const setForceNonTeamMemberOverride = (value: boolean) => {
    if (!isRawTeamMember) return;
    setForceNonTeamMemberOverrideRaw(value);
  };
  const setMockOnboardingIncompleteOverride = (value: boolean) => {
    if (!isRawTeamMember) return;
    setMockOnboardingIncompleteRaw(value);
  };
  const setForceOnboardingCompleteOverride = (value: boolean) => {
    if (!isRawTeamMember) return;
    setForceOnboardingCompleteRaw(value);
  };
  const setForceOnboardingEnabledOverride = (value: boolean) => {
    if (!isRawTeamMember) return;
    setForceOnboardingEnabledRaw(value);
  };
  const setOnboardingResetBaseline = (value: string[]) => {
    if (!isRawTeamMember) return;
    setOnboardingResetBaselineRaw(value);
  };
  const setRelaxedDayUsedPctOverride = (value: number | null) => {
    if (!isRawTeamMember) return;
    setRelaxedDayUsedPctOverrideRaw(value);
  };
  const setRelaxedDayResetAtOverride = (value: string | null) => {
    if (!isRawTeamMember) return;
    setRelaxedDayResetAtOverrideRaw(value);
  };
  const setRelaxedWeekUsedPctOverride = (value: number | null) => {
    if (!isRawTeamMember) return;
    setRelaxedWeekUsedPctOverrideRaw(value);
  };
  const setRelaxedWeekResetAtOverride = (value: string | null) => {
    if (!isRawTeamMember) return;
    setRelaxedWeekResetAtOverrideRaw(value);
  };
  if (!isRawTeamMember) {
    return {
      subscriptionOverride: null,
      setSubscriptionOverride: () => {},
      isLegacyUserOverride: false,
      setIsLegacyUserOverride: () => {},
      createdAtOverride: null,
      setCreatedAtOverride: () => {},
      forceNonTeamMemberOverride: false,
      setForceNonTeamMemberOverride: () => {},
      mockOnboardingIncompleteOverride: false,
      setMockOnboardingIncompleteOverride: () => {},
      forceOnboardingCompleteOverride: false,
      setForceOnboardingCompleteOverride: () => {},
      forceOnboardingEnabledOverride: false,
      setForceOnboardingEnabledOverride: () => {},
      onboardingResetBaseline: [],
      setOnboardingResetBaseline: () => {},
      relaxedDayUsedPctOverride: null,
      setRelaxedDayUsedPctOverride: () => {},
      relaxedDayResetAtOverride: null,
      setRelaxedDayResetAtOverride: () => {},
      relaxedWeekUsedPctOverride: null,
      setRelaxedWeekUsedPctOverride: () => {},
      relaxedWeekResetAtOverride: null,
      setRelaxedWeekResetAtOverride: () => {}
    };
  }

  return {
    subscriptionOverride,
    setSubscriptionOverride,
    isLegacyUserOverride,
    setIsLegacyUserOverride,
    createdAtOverride,
    setCreatedAtOverride,
    forceNonTeamMemberOverride,
    setForceNonTeamMemberOverride,
    mockOnboardingIncompleteOverride,
    setMockOnboardingIncompleteOverride,
    forceOnboardingCompleteOverride,
    setForceOnboardingCompleteOverride,
    forceOnboardingEnabledOverride,
    setForceOnboardingEnabledOverride,
    onboardingResetBaseline,
    setOnboardingResetBaseline,
    relaxedDayUsedPctOverride,
    setRelaxedDayUsedPctOverride,
    relaxedDayResetAtOverride,
    setRelaxedDayResetAtOverride,
    relaxedWeekUsedPctOverride,
    setRelaxedWeekUsedPctOverride,
    relaxedWeekResetAtOverride,
    setRelaxedWeekResetAtOverride
  };
};
