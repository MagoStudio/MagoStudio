import { Text } from "@components/Text";
import { ShotVideoPhase } from "@domains/plan/utils/buildShotRollups";
import { useTranslation } from "react-i18next";

import { PlanAssetPlaceholder } from "./PlanAssetPlaceholder";
import { PlanMetricChip } from "./PlanMetricChip";
import { PlanStepAssetVideo } from "./PlanStepAssetVideo";

interface PlanVideoCardProps {
  video: ShotVideoPhase;
}

export const PlanVideoCard: React.FC<PlanVideoCardProps> = ({ video }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-surface-bg-100">
      <div className="flex items-center justify-between gap-2">
        <Text variant="sm" weight="semibold" color="glyph-primary">
          {t("plan.phase.video.label")}
        </Text>
        {video.metric && <PlanMetricChip metric={video.metric} />}
      </div>

      {video.resultAssetId ? (
        <PlanStepAssetVideo assetId={video.resultAssetId} />
      ) : (
        <PlanAssetPlaceholder />
      )}
    </div>
  );
};
