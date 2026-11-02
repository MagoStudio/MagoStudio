import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

interface PlanProgressBarProps {
  completedTimelines: number;
  totalTimelines: number;
  progressPct: number;
  completedSteps: number;
  totalSteps: number;
}

export const PlanProgressBar: React.FC<PlanProgressBarProps> = ({
  completedTimelines,
  totalTimelines,
  progressPct,
  completedSteps,
  totalSteps
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <LinearProgress
        value={progressPct}
        totalValue={100}
        size="md"
        color="glyph-success"
      />
      <div className="flex items-center gap-3">
        <Text variant="xs" color="glyph-secondary">
          {t("plan.progress_timelines.label", {
            completed: completedTimelines,
            total: totalTimelines,
            percentage: Math.round(progressPct)
          })}
        </Text>
        <Text variant="xs" color="glyph-tertiary">
          {t("plan.progress_steps.label", {
            completed: completedSteps,
            total: totalSteps
          })}
        </Text>
      </div>
    </div>
  );
};
