import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { summarizeTimelineSteps } from "@domains/plan/utils/groupPlanStepsByTimeline";
import { PlanStep } from "@schemas/plan";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { PlanStepItem } from "./PlanStepItem";

interface PlanTimelineGroupProps {
  timelineIndex: number;
  timelineSteps: PlanStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export const PlanTimelineGroup: React.FC<PlanTimelineGroupProps> = ({
  timelineIndex,
  timelineSteps,
  selectedStepId,
  onSelectStep
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const summary = summarizeTimelineSteps(timelineSteps);
  const badgeColor =
    summary.kind === "running"
      ? ("glyph-primary" as const)
      : summary.kind === "failed"
        ? ("glyph-error" as const)
        : summary.kind === "done"
          ? ("glyph-success" as const)
          : ("glyph-secondary" as const);

  return (
    <div className="flex flex-col gap-1">
      <AriaButton
        onPress={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 py-1.5 px-1 rounded hover:bg-surface-bg-200 transition-colors cursor-pointer outline-hidden"
      >
        <div className="flex items-center gap-2">
          <Icon
            iconSet="16"
            iconName={isOpen ? "chevron-down" : "chevron-right"}
            className="text-glyph-tertiary"
          />
          <Text variant="sm" weight="semibold" color="glyph-secondary">
            {t("plan.timelines_count_index.label", {
              index: timelineIndex + 1
            })}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Text variant="xs" color="glyph-tertiary">
            {summary.completed}/{summary.total}
          </Text>
          <Badge glyphColor={badgeColor}>
            {t(`plan.timeline_summary.${summary.kind}.label`)}
          </Badge>
        </div>
      </AriaButton>
      {isOpen && (
        <div className="flex flex-col gap-1">
          {timelineSteps.map((step) => (
            <PlanStepItem
              key={step.id}
              step={step}
              isSelected={step.id === selectedStepId}
              onSelect={onSelectStep}
            />
          ))}
        </div>
      )}
    </div>
  );
};
