import { TabMenuRegular } from "@components/TabMenuRegular";
import { useImageAssets } from "@domains/asset/useImageAssets";
import { useBulkRendersRunSteps } from "@domains/bulkRendersRun/useBulkRendersRunSteps";
import { buildBulkRendersRunImageResultUrlByAssetId } from "@domains/bulkRendersRun/utils/buildBulkRendersRunImageResultUrlByAssetId";
import { resolveBulkRendersRunShotResultAssetId } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotResultAssetId";
import { sortShotIdsByShotName } from "@domains/bulkRendersRun/utils/sortShotIdsByShotName";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { BulkRendersRun, BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { useState } from "react";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

import { BulkRenderingShotCardGrid } from "./BulkRenderingShotCardGrid";
import { BulkRenderingStepId } from "./types";
import { mapBulkRendersRunStepsToShotCardRows } from "./utils/mapBulkRendersRunStepsToShotCardRows";

interface Props {
  run: BulkRendersRun;
}

const resolveResultAssetIds = ({
  shotIds,
  steps,
  resolve
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
  resolve: (shotSteps: BulkRendersRunStep[]) => string | undefined;
}): string[] =>
  shotIds
    .map((shotId) =>
      resolve(steps.filter((step) => step.timeline_id === shotId))
    )
    .filter((assetId): assetId is string => !!assetId);

export const BulkRenderingHistoryRowShotTabs: React.FC<Props> = ({ run }) => {
  const { t } = useTranslation();
  const [selectedStep, setSelectedStep] =
    useState<BulkRenderingStepId>("image");
  const { data: steps } = useBulkRendersRunSteps({
    bulkRunId: run.id,
    isBulkRendersRunActive: false
  });
  const resolvedSteps = steps ?? [];
  const hasVideoChain = !!run.input_settings?.video_settings;

  const {
    data: { shotFoldersAndShots }
  } = useProjectShotFolders(run.project_id ?? undefined);
  const shotNameById = new Map(
    shotFoldersAndShots
      .filter((item) => item.type === "shot")
      .map((shot) => [shot.id, shot.name])
  );
  const shotIds = sortShotIdsByShotName(
    run.input_settings?.timeline_ids ?? [],
    shotNameById
  );
  const videoShotIds = hasVideoChain ? shotIds : [];

  const imageResultAssetIds = resolveResultAssetIds({
    shotIds,
    steps: resolvedSteps,
    resolve: resolveBulkRendersRunShotResultAssetId
  });
  const { data: resolvedImageAssets, isLoading: isImageResultLoading } =
    useImageAssets({
      assetIds: imageResultAssetIds,
      enabled: imageResultAssetIds.length > 0
    });
  const imageResultUrlByAssetId =
    buildBulkRendersRunImageResultUrlByAssetId(resolvedImageAssets);

  const imageShotRows = mapBulkRendersRunStepsToShotCardRows({
    stepId: "image",
    shotIds,
    shotNameById,
    steps: resolvedSteps,
    resultUrlByAssetId: imageResultUrlByAssetId
  });
  const videoShotRows = mapBulkRendersRunStepsToShotCardRows({
    stepId: "video",
    shotIds: videoShotIds,
    shotNameById,
    steps: resolvedSteps,
    resultUrlByAssetId: imageResultUrlByAssetId
  });

  return (
    <Tabs
      selectedKey={selectedStep}
      onSelectionChange={(key) => setSelectedStep(key as BulkRenderingStepId)}
      className="flex flex-col gap-3"
    >
      <TabMenuRegular
        className="pt-3"
        tabs={[
          {
            id: "image",
            name: t("bulk_rendering.run_view_image_step_tab.label")
          },
          {
            id: "video",
            name: t("bulk_rendering.run_view_video_step_tab.label")
          }
        ]}
      />
      <TabPanel id="image">
        <BulkRenderingShotCardGrid
          shots={imageShotRows}
          stepId="image"
          isImageResultLoading={isImageResultLoading}
        />
      </TabPanel>
      <TabPanel id="video">
        <BulkRenderingShotCardGrid
          shots={videoShotRows}
          stepId="video"
          isImageResultLoading={isImageResultLoading}
        />
      </TabPanel>
    </Tabs>
  );
};
