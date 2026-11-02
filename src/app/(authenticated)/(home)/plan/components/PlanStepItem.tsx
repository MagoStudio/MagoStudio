import { Badge } from "@components/Badge";
import { Text } from "@components/Text";
import { STEP_STATUS_COLOR_MAP } from "@domains/plan/utils/planStatuses";
import { PlanStep } from "@schemas/plan";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

interface PlanStepItemProps {
  step: PlanStep;
  isSelected: boolean;
  onSelect: (stepId: string) => void;
}

export const PlanStepItem: React.FC<PlanStepItemProps> = ({
  step,
  isSelected,
  onSelect
}) => {
  const { t } = useTranslation();

  return (
    <AriaButton
      onPress={() => onSelect(step.id)}
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2 w-full text-left rounded transition-colors cursor-pointer outline-hidden",
        isSelected
          ? "bg-element-primary-active"
          : "bg-surface-bg-100 hover:bg-surface-bg-200"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Text variant="xs" color="glyph-tertiary" className="shrink-0 w-5">
          {step.step_order + 1}
        </Text>
        <Text variant="sm" color="glyph-primary" className="truncate">
          {t(`plan.step_tool.${step.tool_name}.label`)}
        </Text>
      </div>
      <Badge
        glyphColor={STEP_STATUS_COLOR_MAP[step.status]}
        className="shrink-0"
      >
        {t(`plan.step_status.${step.status}.label`)}
      </Badge>
    </AriaButton>
  );
};
