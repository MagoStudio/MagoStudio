import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { buildShotRollups } from "@domains/plan/utils/buildShotRollups";
import { useProject } from "@domains/project/useProject";
import { Plan, PlanStep } from "@schemas/plan";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { PlanSettingsSummary } from "./PlanSettingsSummary";
import { PlanShotLane } from "./PlanShotLane";

interface PlanFriendlyViewProps {
  plan: Plan;
  steps: PlanStep[];
}

export const PlanFriendlyView: React.FC<PlanFriendlyViewProps> = ({
  plan,
  steps
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const inputData = plan.input_data;
  const projectId = inputData?.project_id;
  const timelineOrder = inputData?.timeline_ids ?? [];

  const { data: shotNamesById } = useProject(projectId, (project) =>
    Object.fromEntries(
      (project.timelines ?? []).map((shot) => [shot.id, shot.name])
    )
  );

  const rollups = buildShotRollups(
    steps,
    timelineOrder,
    inputData?.img2img_settings?.reference_images ?? []
  );

  const shotName = (timelineId: string, index: number): string =>
    shotNamesById?.[timelineId] ||
    t("plan.timelines_count_index.label", { index: index + 1 });

  const openShot = (timelineId: string) => {
    if (!projectId) return;
    router.push(
      `${ROUTES.PROJECT_TIMELINE}?projectId=${projectId}&timelineId=${timelineId}`
    );
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 w-full max-w-3xl overflow-y-auto">
      {inputData && <PlanSettingsSummary inputData={inputData} />}

      {rollups.length === 0 ? (
        <Text variant="sm" color="glyph-tertiary">
          {t("plan.no_shots.label")}
        </Text>
      ) : (
        rollups.map((rollup, index) => (
          <PlanShotLane
            key={rollup.timelineId}
            rollup={rollup}
            shotName={shotName(rollup.timelineId, index)}
            projectId={projectId}
            onOpenShot={
              projectId ? () => openShot(rollup.timelineId) : undefined
            }
          />
        ))
      )}
    </div>
  );
};
