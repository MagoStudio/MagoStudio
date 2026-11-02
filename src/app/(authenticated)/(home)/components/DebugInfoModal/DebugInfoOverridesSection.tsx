import { Checkbox } from "@components/Checkbox";
import { Dropdown, DropdownItem } from "@components/Dropdown";
import { Text } from "@components/Text";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { isOnboardingProjectName } from "@domains/onboarding/utils/onboardingProjectName";
import { useProjectList } from "@domains/project/useProjectList";
import { useDebugInfoModal } from "@hooks/useDebugInfoModal";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { useSubscriptionOverride } from "@hooks/useSubscriptionOverride";
import { SubscriptionType } from "@schemas/balance";
import { INITIAL_ONBOARDING_PROGRESS } from "@store/atoms/onboardingAtom";
import { useTranslation } from "react-i18next";

import { buildOverridesSectionCopyText } from "./buildOverridesSectionCopyText";
import { DebugInfoSection } from "./DebugInfoSection";

const SUBSCRIPTION_LABELS: Record<SubscriptionType, string> = {
  [SubscriptionType.FREE]: "Free",
  [SubscriptionType.UNLIMITED_BASIC]: "Basic (legacy)",
  [SubscriptionType.UNLIMITED_PRO]: "Pro (Relaxed)",
  [SubscriptionType.UNLIMITED_PRO_ANNUAL]: "Pro annual (Relaxed)",
  [SubscriptionType.UNLIMITED_STUDIO]: "Studio (Unlimited)",
  [SubscriptionType.UNLIMITED_STUDIO_ANNUAL]: "Studio annual (Unlimited)"
};

const SUBSCRIPTION_OPTIONS: DropdownItem[] = [
  { key: "", label: "None" },
  ...Object.values(SubscriptionType).map((v) => ({
    key: v,
    label: SUBSCRIPTION_LABELS[v] ?? v
  }))
];

const MIN_PCT = 0;
const MAX_PCT = 100;

export function DebugInfoOverridesSection() {
  const { t } = useTranslation();
  const { close } = useDebugInfoModal();
  const [, setOnboardingProgress] = useOnboardingProgress();
  const { allItems: projects } = useProjectList();
  const isTeamMember = useIsTeamMember();

  const {
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
    setOnboardingResetBaseline,
    relaxedDayUsedPctOverride,
    setRelaxedDayUsedPctOverride,
    relaxedDayResetAtOverride,
    setRelaxedDayResetAtOverride,
    relaxedWeekUsedPctOverride,
    setRelaxedWeekUsedPctOverride,
    relaxedWeekResetAtOverride,
    setRelaxedWeekResetAtOverride
  } = useSubscriptionOverride();

  const resetOnboarding = () => {
    setOnboardingResetBaseline(
      projects.filter((p) => isOnboardingProjectName(p.name)).map((p) => p.id)
    );
    setOnboardingProgress(INITIAL_ONBOARDING_PROGRESS);
    close();
    setMockOnboardingIncompleteOverride(true);
  };

  const hasActiveOverrides =
    !!subscriptionOverride ||
    isLegacyUserOverride ||
    !!createdAtOverride ||
    forceNonTeamMemberOverride ||
    mockOnboardingIncompleteOverride ||
    forceOnboardingCompleteOverride ||
    forceOnboardingEnabledOverride ||
    relaxedDayUsedPctOverride != null ||
    !!relaxedDayResetAtOverride ||
    relaxedWeekUsedPctOverride != null ||
    !!relaxedWeekResetAtOverride;

  const copyText = buildOverridesSectionCopyText(t, {
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
  });

  const inputClassName =
    "h-6 rounded border border-glyph-stroke bg-surface-bg-200 px-1 text-xs text-glyph-secondary";
  const resetButtonClassName =
    "shrink-0 px-1 text-xs leading-none text-glyph-tertiary hover:text-glyph-primary";

  const resetAllOverrides = () => {
    setSubscriptionOverride(null);
    setIsLegacyUserOverride(false);
    setCreatedAtOverride(null);
    setForceNonTeamMemberOverride(false);
    setMockOnboardingIncompleteOverride(false);
    setForceOnboardingCompleteOverride(false);
    setForceOnboardingEnabledOverride(false);
    setOnboardingResetBaseline([]);
    setRelaxedDayUsedPctOverride(null);
    setRelaxedDayResetAtOverride(null);
    setRelaxedWeekUsedPctOverride(null);
    setRelaxedWeekResetAtOverride(null);
  };

  return (
    <DebugInfoSection
      title={t("titles.dev_overrides.label")}
      copyText={copyText}
    >
      {hasActiveOverrides && (
        <div className="rounded bg-red-500/10 px-2 py-1 flex flex-col gap-0.5">
          {subscriptionOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.subscription_override.label")}: {subscriptionOverride}
            </Text>
          )}
          {isLegacyUserOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.legacy_user_override.label")}: true
            </Text>
          )}
          {createdAtOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.created_at_override.label")}: {createdAtOverride}
            </Text>
          )}
          {forceNonTeamMemberOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.force_non_team_member_override.label")}: true
            </Text>
          )}
          {mockOnboardingIncompleteOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.mock_onboarding_incomplete_override.label")}: true
            </Text>
          )}
          {forceOnboardingCompleteOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.force_onboarding_complete_override.label")}: true
            </Text>
          )}
          {forceOnboardingEnabledOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.force_onboarding_enabled_override.label")}: true
            </Text>
          )}
          {relaxedDayUsedPctOverride != null && (
            <Text variant="xs" className="text-red-500">
              {t("titles.relaxed_day_pct_override.label")}:{" "}
              {relaxedDayUsedPctOverride}
            </Text>
          )}
          {relaxedDayResetAtOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.relaxed_day_reset_override.label")}:{" "}
              {relaxedDayResetAtOverride}
            </Text>
          )}
          {relaxedWeekUsedPctOverride != null && (
            <Text variant="xs" className="text-red-500">
              {t("titles.relaxed_week_pct_override.label")}:{" "}
              {relaxedWeekUsedPctOverride}
            </Text>
          )}
          {relaxedWeekResetAtOverride && (
            <Text variant="xs" className="text-red-500">
              {t("titles.relaxed_week_reset_override.label")}:{" "}
              {relaxedWeekResetAtOverride}
            </Text>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.subscription_override.label")}
          </Text>
          <Dropdown
            className="w-44"
            aria-label={t("titles.subscription_override.label")}
            items={SUBSCRIPTION_OPTIONS}
            selectedKey={subscriptionOverride ?? ""}
            onSelectionChange={(key) =>
              setSubscriptionOverride(key ? (key as SubscriptionType) : null)
            }
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.legacy_user_override.label")}
          </Text>
          <Checkbox
            isChecked={isLegacyUserOverride}
            onChange={(e) => setIsLegacyUserOverride(e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.created_at_override.label")}
          </Text>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={createdAtOverride ?? ""}
              onChange={(e) => setCreatedAtOverride(e.target.value || null)}
              className={inputClassName}
            />
            {createdAtOverride && (
              <button
                type="button"
                aria-label={t("actions.reset_override.label")}
                onClick={() => setCreatedAtOverride(null)}
                className={resetButtonClassName}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.force_non_team_member_override.label")}
          </Text>
          <Checkbox
            isChecked={forceNonTeamMemberOverride}
            onChange={(e) => setForceNonTeamMemberOverride(e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.mock_onboarding_incomplete_override.label")}
          </Text>
          <Checkbox
            isChecked={mockOnboardingIncompleteOverride}
            onChange={(e) => {
              setMockOnboardingIncompleteOverride(e.target.checked);
              if (e.target.checked) setForceOnboardingCompleteOverride(false);
              if (!e.target.checked) setOnboardingResetBaseline([]);
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.force_onboarding_complete_override.label")}
          </Text>
          <Checkbox
            isChecked={forceOnboardingCompleteOverride}
            onChange={(e) => {
              setForceOnboardingCompleteOverride(e.target.checked);
              if (e.target.checked) {
                setMockOnboardingIncompleteOverride(false);
                setOnboardingResetBaseline([]);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.force_onboarding_enabled_override.label")}
          </Text>
          <Checkbox
            isChecked={forceOnboardingEnabledOverride}
            onChange={(e) =>
              setForceOnboardingEnabledOverride(e.target.checked)
            }
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.relaxed_day_pct_override.label")}
          </Text>
          <input
            type="number"
            min={MIN_PCT}
            max={MAX_PCT}
            value={relaxedDayUsedPctOverride ?? ""}
            onChange={(e) =>
              setRelaxedDayUsedPctOverride(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={inputClassName}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.relaxed_day_reset_override.label")}
          </Text>
          <div className="flex items-center gap-1">
            <input
              type="datetime-local"
              value={relaxedDayResetAtOverride ?? ""}
              onChange={(e) =>
                setRelaxedDayResetAtOverride(e.target.value || null)
              }
              className={inputClassName}
            />
            {relaxedDayResetAtOverride && (
              <button
                type="button"
                aria-label={t("actions.reset_override.label")}
                onClick={() => setRelaxedDayResetAtOverride(null)}
                className={resetButtonClassName}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.relaxed_week_pct_override.label")}
          </Text>
          <input
            type="number"
            min={MIN_PCT}
            max={MAX_PCT}
            value={relaxedWeekUsedPctOverride ?? ""}
            onChange={(e) =>
              setRelaxedWeekUsedPctOverride(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={inputClassName}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {t("titles.relaxed_week_reset_override.label")}
          </Text>
          <div className="flex items-center gap-1">
            <input
              type="datetime-local"
              value={relaxedWeekResetAtOverride ?? ""}
              onChange={(e) =>
                setRelaxedWeekResetAtOverride(e.target.value || null)
              }
              className={inputClassName}
            />
            {relaxedWeekResetAtOverride && (
              <button
                type="button"
                aria-label={t("actions.reset_override.label")}
                onClick={() => setRelaxedWeekResetAtOverride(null)}
                className={resetButtonClassName}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={resetAllOverrides}
            disabled={!hasActiveOverrides}
            className="self-start rounded border border-glyph-stroke px-2 py-1 text-xs text-glyph-secondary hover:text-glyph-primary disabled:opacity-40"
          >
            {t("actions.reset_all_overrides.label")}
          </button>
          {isTeamMember && (
            <button
              type="button"
              onClick={resetOnboarding}
              className="self-start rounded border border-glyph-stroke px-2 py-1 text-xs text-glyph-secondary hover:text-glyph-primary"
            >
              {t("actions.reset_onboarding.label")}
            </button>
          )}
        </div>
      </div>
    </DebugInfoSection>
  );
}
