import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import { usePinProjectShot } from "@domains/scriptProject/usePinProjectShot";
import { useProjectCut } from "@domains/scriptProject/useProjectCut";
import { useProjectOutputSize } from "@domains/scriptProject/useProjectOutputSize";
import { useProjectUpscaleDryRun } from "@domains/scriptProject/useProjectUpscaleDryRun";
import { useShotsByDropped } from "@domains/scriptProject/useShotsByDropped";
import { useUpscaleProjectShots } from "@domains/scriptProject/useUpscaleProjectShots";
import { filterCutToActiveScript } from "@domains/scriptProject/utils/filterCutToActiveScript";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { resolveWouldRunShotTimelineIds } from "@domains/scriptProject/utils/resolveWouldRunShotTimelineIds";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CutShotTile } from "./CutShotTile";
import { CutShotVersionList } from "./CutShotVersionList";
import { GenerateRunButton } from "./GenerateRunButton";

type Props = {
  projectId: string;
  renderingShotTimelineIds: Set<string>;
  isRunActive: boolean;
  canRender: boolean;
  onRunStarted: (planId: string, shotTimelineIds: string[]) => void;
};

export const PostTab: React.FC<Props> = ({
  projectId,
  renderingShotTimelineIds,
  isRunActive,
  canRender,
  onRunStarted
}) => {
  const { t } = useTranslation();
  const [selectedShotTimelineId, setSelectedShotTimelineId] = useState<
    string | null
  >(null);

  const {
    data: cut,
    isPending: isCutPending,
    error: cutError
  } = useProjectCut(projectId);
  const { data: project } = useProject(projectId);
  const isUpscaleAvailableForProject = project?.origin !== "local";
  const { data: dryRun } = useProjectUpscaleDryRun(projectId);
  const { outputSize } = useProjectOutputSize(projectId);
  const { mutate: upscaleShots, isPending: isUpscalingShots } =
    useUpscaleProjectShots();
  const { mutate: pinShot, isPending: isPinningShot } = usePinProjectShot();

  const { shotsDroppedByRecast } = useShotsByDropped(projectId);
  const {
    cutShotsInActiveScript: shots,
    missingSequenceIdsInActiveScript: missingSequenceIds
  } = filterCutToActiveScript(cut, shotsDroppedByRecast);
  const hasNoShotRendersYet =
    shots.length > 0 && shots.every((shot) => shot.versions.length === 0);
  const upscalableShotTimelineIds = resolveWouldRunShotTimelineIds(
    dryRun,
    shots
  );
  const upscalableShotCount = upscalableShotTimelineIds.length;
  const selectedShot =
    shots.find((shot) => shot.timeline_id === selectedShotTimelineId) ??
    shots[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-end gap-3 border-b border-element-primary px-6 py-3">
        {missingSequenceIds.length > 0 && (
          <Text variant="xs" color="glyph-warning">
            {t("script_project.cut_missing.label", {
              count: missingSequenceIds.length
            })}
          </Text>
        )}
        {isUpscaleAvailableForProject && (
          <GenerateRunButton
            label={t("script_project.upscale_button.label")}
            countLabel={
              upscalableShotCount > 0
                ? t("script_project.upscale_button.count", {
                    count: upscalableShotCount
                  })
                : t("script_project.upscale_button.nothing")
            }
            cost={null}
            isDisabled={
              !canRender ||
              upscalableShotCount === 0 ||
              isUpscalingShots ||
              isRunActive
            }
            isPending={isUpscalingShots || isRunActive}
            onPress={() =>
              upscaleShots(
                { projectId, isDryRun: false },
                {
                  onSuccess: (result) => {
                    if (result.plan_id)
                      onRunStarted(
                        result.plan_id,
                        resolveWouldRunShotTimelineIds(result, shots)
                      );
                  }
                }
              )
            }
            testId="script-project-upscale"
          />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div className="flex flex-col gap-3">
          <Text variant="sm" weight="semibold" color="glyph-secondary">
            {t("script_project.cut_title.label")}
          </Text>
          {cutError ? (
            <Text variant="sm" color="glyph-error">
              {t("script_project.cut_load_failed.label")}
            </Text>
          ) : isCutPending ? (
            <Text variant="sm" color="glyph-tertiary">
              {t("script_project.loading.label")}
            </Text>
          ) : hasNoShotRendersYet ? (
            <div className="flex flex-col gap-1">
              <Text variant="sm" color="glyph-tertiary">
                {t("script_project.no_shot_renders_yet.label", {
                  count: shots.length
                })}
              </Text>
              <Text variant="xs" color="glyph-tertiary">
                {t("script_project.no_shot_renders_hint.label")}
              </Text>
            </div>
          ) : shots.length === 0 ? (
            <Text variant="sm" color="glyph-tertiary">
              {t("script_project.no_shots_in_cut.label")}
            </Text>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {shots.map((shot) => (
                <CutShotTile
                  key={shot.timeline_id}
                  shot={shot}
                  outputSize={outputSize}
                  isSelected={shot.timeline_id === selectedShot?.timeline_id}
                  isRendering={renderingShotTimelineIds.has(shot.timeline_id)}
                  onSelect={() => setSelectedShotTimelineId(shot.timeline_id)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedShot && (
          <div className="flex flex-col gap-3">
            <Text variant="sm" weight="semibold" color="glyph-secondary">
              {t("script_project.shot_versions_title.label", {
                shot: formatShotTitle({
                  heading: selectedShot.heading,
                  shotIndex: selectedShot.shot_index
                })
              })}
            </Text>
            <CutShotVersionList
              shot={selectedShot}
              outputSize={outputSize}
              isBusy={isPinningShot}
              onPin={(assetId) =>
                pinShot({
                  projectId,
                  timelineId: selectedShot.timeline_id,
                  selectedAssetId: assetId
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
