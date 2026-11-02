import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { ACTIVE_PLAN_STATUSES } from "@domains/plan/utils/planStatuses";
import { PlanSummary } from "@schemas/plan";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { PlanStatusBadge } from "./PlanStatusBadge";

interface PlanListItemProps {
  plan: PlanSummary;
  onClick: (planId: string) => void;
  onReuse?: (planId: string) => void;
  isReusing?: boolean;
}

export const PlanListItem: React.FC<PlanListItemProps> = ({
  plan,
  onClick,
  onReuse,
  isReusing
}) => {
  const { t } = useTranslation();
  const isActive = ACTIVE_PLAN_STATUSES.has(plan.status);
  const createdDate = new Date(plan.created_at).toLocaleDateString();
  const pct = plan.progress_pct;

  return (
    <AriaButton
      onPress={() => onClick(plan.id)}
      className="flex flex-col gap-2 p-4 rounded-lg bg-surface-bg-100 hover:bg-element-primary-active cursor-pointer transition-colors text-left outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary"
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <Text variant="md" weight="semibold" color="glyph-primary">
          {plan.name || t("plan.untitled.label")}
        </Text>
        <div className="flex items-center gap-2">
          <PlanStatusBadge status={plan.status} />
          {onReuse && (
            <div onClick={(e) => e.stopPropagation()}>
              <IconActionButton
                aria-label={t("plan.reuse_settings.label")}
                icon={<Icon iconSet="16" iconName="reuse" />}
                loading={isReusing}
                onPress={() => onReuse(plan.id)}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Text variant="xs" color="glyph-tertiary">
          {createdDate}
        </Text>
        <Text variant="xs" color="glyph-secondary">
          {t("plan.progress_pct.label", { percentage: Math.round(pct) })}
        </Text>
        {plan.stats && (
          <Text
            variant="xs"
            color={
              plan.stats.attention_count > 0
                ? "glyph-warning"
                : "glyph-secondary"
            }
          >
            {t("plan.summary_runs.label", {
              passed: plan.stats.total_amount_of_quality_passed_runs,
              total: plan.stats.total_amount_of_evaluated_runs,
              rate: Math.round(plan.stats.quality_success_rate)
            })}
          </Text>
        )}
      </div>
      {isActive && (
        <LinearProgress
          value={pct}
          totalValue={100}
          size="sm"
          color="glyph-success"
        />
      )}
    </AriaButton>
  );
};
