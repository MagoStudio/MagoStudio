import { Text } from "@components/Text";
import { groupPlanStepsByTimeline } from "@domains/plan/utils/groupPlanStepsByTimeline";
import { PlanStep } from "@schemas/plan";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PlanStepDetail } from "./PlanStepDetail";
import { PlanTimelineGroup } from "./PlanTimelineGroup";

interface PlanError {
  message: string;
}

interface PlanStepListProps {
  steps: PlanStep[];
  planError: PlanError | null;
}

export const PlanStepList: React.FC<PlanStepListProps> = ({
  steps,
  planError
}) => {
  const { t } = useTranslation();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const groupedByTimeline = groupPlanStepsByTimeline(steps);
  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <div className="flex flex-col gap-3 w-1/3 min-w-0 shrink-0 overflow-y-auto">
        {Array.from(groupedByTimeline.entries()).map(
          ([timelineId, timelineSteps], index) => (
            <PlanTimelineGroup
              key={timelineId}
              timelineIndex={index}
              timelineSteps={timelineSteps}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
            />
          )
        )}
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedStep && <PlanStepDetail step={selectedStep} />}
        {!selectedStep && planError && (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-bg-100">
            <Text variant="md" weight="semibold" color="glyph-error">
              {t("plan.error_details.label")}
            </Text>
            <Text
              variant="sm"
              color="glyph-error"
              className="whitespace-pre-wrap break-all"
            >
              {planError.message}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
