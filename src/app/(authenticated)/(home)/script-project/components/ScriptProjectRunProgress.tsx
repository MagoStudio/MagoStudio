import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  stepsCompleted: number;
  stepsTotal: number;
  progressPercent: number;
};

export const ScriptProjectRunProgress: React.FC<Props> = ({
  stepsCompleted,
  stepsTotal,
  progressPercent
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col gap-1.5 border-b border-element-primary px-6 py-3"
      data-testid="script-project-run-progress"
    >
      <div className="flex items-center justify-between gap-3">
        <Text variant="xs" color="glyph-secondary">
          {t("script_project.run_in_progress.label")}
        </Text>
        {stepsTotal > 0 && (
          <Text variant="xs" color="glyph-tertiary">
            {t("script_project.run_step_count.label", {
              completed: stepsCompleted,
              total: stepsTotal
            })}
          </Text>
        )}
      </div>
      <LinearProgress size="sm" value={progressPercent} totalValue={100} />
    </div>
  );
};
