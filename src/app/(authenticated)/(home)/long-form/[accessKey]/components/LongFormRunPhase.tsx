import { LoadingIndicator } from "@components/LoadingIndicator";
import { Text } from "@components/Text";
import { ScenarioRunPhase } from "@domains/longFormRun/utils/deriveScenarioRunPhase";
import { PlanStatus } from "@schemas/plan";
import { useTranslation } from "react-i18next";

interface LongFormRunPhaseProps {
  status: PlanStatus | undefined;
  phase: ScenarioRunPhase | undefined;
}

const PHASE_TRANSLATION_KEY: Record<ScenarioRunPhase, string> = {
  readingScript: "longForm.phase.readingScript.label",
  planningShots: "longForm.phase.planningShots.label",
  drawingCastAndSets: "longForm.phase.drawingCastAndSets.label",
  preparingReferences: "longForm.phase.preparingReferences.label",
  renderingShots: "longForm.phase.renderingShots.label"
};

export const LongFormRunPhase: React.FC<LongFormRunPhaseProps> = ({
  status,
  phase
}) => {
  const { t } = useTranslation();

  if (!status) return null;

  if (status === "COMPLETED") {
    return (
      <Text
        data-testid="long-form-run-phase"
        component="span"
        variant="sm"
        color="glyph-success"
      >
        {t("longForm.outcome.completed.label")}
      </Text>
    );
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <Text
        data-testid="long-form-run-phase"
        component="span"
        variant="sm"
        color="glyph-error"
      >
        {t("longForm.outcome.failed.label")}
      </Text>
    );
  }

  return (
    <div data-testid="long-form-run-phase" className="flex items-center gap-2">
      <LoadingIndicator className="size-4" />
      {phase && (
        <Text component="span" variant="sm" color="glyph-secondary">
          {t(PHASE_TRANSLATION_KEY[phase])}
        </Text>
      )}
    </div>
  );
};
