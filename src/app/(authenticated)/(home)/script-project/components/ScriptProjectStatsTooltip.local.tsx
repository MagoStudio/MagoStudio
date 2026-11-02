import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { RenderStats } from "@domains/project/interface";
import { useProjectStats } from "@domains/project/useProjectStats";
import { useProjectCut } from "@domains/scriptProject/useProjectCut";
import { buildOriginAwareScriptProjectStatsSummary } from "@domains/scriptProject/utils/buildOriginAwareScriptProjectStatsSummary";
import { useQueue } from "@hooks/queue/useQueue";
import { Project } from "@schemas/project";
import { ProjectState } from "@schemas/scriptProject";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const COST_DECIMALS = 2;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

const formatDuration = (totalSeconds: number): string => {
  const wholeSeconds = Math.round(totalSeconds);
  const secondsPerHour = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const hours = Math.floor(wholeSeconds / secondsPerHour);
  const minutes = Math.floor(
    (wholeSeconds % secondsPerHour) / SECONDS_PER_MINUTE
  );
  const seconds = wholeSeconds % SECONDS_PER_MINUTE;
  return [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    seconds > 0 ? `${seconds}s` : null
  ]
    .filter(Boolean)
    .join(" ");
};

type Props = {
  projectId: string;
  projectState?: ProjectState;
  origin?: Project["origin"];
};

export const ScriptProjectStatsTooltip: React.FC<Props> = ({
  projectId,
  projectState,
  origin
}) => {
  const { t } = useTranslation();
  const { data: cut } = useProjectCut(projectId);
  const { data: queueItems } = useQueue();
  const hasCompletedCloudRender = useMemo(() => {
    if (origin !== "cloud") return false;
    const hasImage = (projectState?.keys ?? []).some((asset) =>
      asset.images.some(
        (image) =>
          image.source === "render" &&
          ["success", "available", "finished"].includes(
            image.status.toLowerCase()
          )
      )
    );
    const hasVideo = (cut?.shots ?? []).some(
      (shot) =>
        (!!shot.asset_id && !!shot.url) ||
        shot.versions.some(
          (version) =>
            version.ready ||
            !!version.url ||
            version.status.toLowerCase() === "success"
        )
    );
    return hasImage || hasVideo;
  }, [cut, origin, projectState]);
  const { data: stats } = useProjectStats(projectId, {
    origin,
    backfillMissingCost: hasCompletedCloudRender
  });
  const rows = useMemo(() => {
    const renderStats = Object.fromEntries(
      Object.entries(stats ?? {}).filter(([key]) => key !== "total")
    ) as Record<string, RenderStats>;
    const summary = buildOriginAwareScriptProjectStatsSummary({
      projectState,
      cut,
      origin,
      renderStats,
      totalCost: stats?.total.total_cost,
      queueItems: queueItems?.filter((item) => item.project_id === projectId)
    });
    return [
      {
        label: t("script_project.stats_assets.label"),
        value: summary.assetCount
      },
      {
        label: t("script_project.stats_asset_images.label"),
        value: summary.assetImageCount
      },
      {
        label: t("script_project.stats_sequences.label"),
        value: summary.sequenceCount
      },
      {
        label: t("script_project.stats_shots.label"),
        value: summary.shotCount
      },
      {
        label: t("script_project.stats_rendered_videos.label"),
        value: summary.renderedVideoCount
      },
      {
        label: t("script_project.stats_image_cost.label"),
        value:
          summary.estimatedCloudImageCredits > 0
            ? t("script_project.stats_image_cost.value", {
                credits:
                  summary.estimatedCloudImageCredits.toFixed(COST_DECIMALS)
              })
            : 0
      },
      {
        label: t("script_project.stats_video_cost.label"),
        value:
          summary.estimatedCloudVideoCredits > 0
            ? t("script_project.stats_video_cost.value", {
                credits:
                  summary.estimatedCloudVideoCredits.toFixed(COST_DECIMALS)
              })
            : 0
      },
      {
        label: t("script_project.stats_cloud_cost.label"),
        value:
          summary.magoCloudCredits > 0
            ? `${summary.isMagoCloudCostEstimated ? "≈" : ""}${summary.magoCloudCredits.toFixed(COST_DECIMALS)} cr.`
            : 0
      },
      {
        label: t("script_project.stats_local_render_time.label"),
        value:
          summary.localRenderSeconds > 0
            ? formatDuration(summary.localRenderSeconds)
            : 0
      },
      {
        label: t("script_project.stats_h3_max_equivalent.label"),
        value:
          summary.magoCloudH3MaxEquivalentCredits > 0
            ? `${summary.magoCloudH3MaxEquivalentCredits.toFixed(COST_DECIMALS)} cr.`
            : 0
      }
    ].filter((row) => row.value !== 0);
  }, [cut, origin, projectId, projectState, queueItems, stats, t]);

  if (rows.length === 0) return null;

  return (
    <Tooltip
      placement="bottom"
      textContent={
        <div className="flex min-w-52 flex-col gap-1.5">
          <Text variant="sm" weight="semibold" color="glyph-primary-on-pic">
            {t("script_project.stats_title.label")}
          </Text>
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-6">
              <Text variant="xs" color="glyph-secondary">
                {row.label}
              </Text>
              <Text variant="xs" weight="semibold" color="glyph-primary-on-pic">
                {row.value}
              </Text>
            </div>
          ))}
        </div>
      }
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded text-glyph-tertiary hover:bg-element-primary-active hover:text-glyph-secondary"
        aria-label={t("script_project.stats_button.ariaLabel")}
        data-testid="script-project-stats-tooltip"
      >
        <Icon iconSet="16" iconName="info" />
      </span>
    </Tooltip>
  );
};
