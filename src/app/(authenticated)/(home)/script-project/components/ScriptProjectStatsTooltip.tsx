import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { useProjectStats } from "@domains/project/useProjectStats";
import { useProjectCut } from "@domains/scriptProject/useProjectCut";
import { buildScriptProjectStatsSummary } from "@domains/scriptProject/utils/buildScriptProjectStatsSummary";
import { Project } from "@schemas/project";
import { ProjectState } from "@schemas/scriptProject";
import { Button } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

const CREDIT_DECIMALS = 2;

interface ScriptProjectStatsTooltipProps {
  projectId: Project["id"];
  projectState?: ProjectState;
}

export const ScriptProjectStatsTooltip: React.FC<
  ScriptProjectStatsTooltipProps
> = ({ projectId, projectState }) => {
  const { t } = useTranslation();
  const { data: cut } = useProjectCut(projectId);
  const { data: projectStats } = useProjectStats(projectId);

  const summary = buildScriptProjectStatsSummary({
    projectState,
    cut,
    totalCostInCredits: projectStats?.total.total_cost
  });

  const rows = [
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
        summary.estimatedImageCredits > 0
          ? t("script_project.stats_image_cost.value", {
              credits: summary.estimatedImageCredits.toFixed(CREDIT_DECIMALS)
            })
          : 0
    },
    {
      label: t("script_project.stats_video_cost.label"),
      value:
        summary.estimatedVideoCredits > 0
          ? t("script_project.stats_video_cost.value", {
              credits: summary.estimatedVideoCredits.toFixed(CREDIT_DECIMALS)
            })
          : 0
    },
    {
      label: t("script_project.stats_total_cost.label"),
      value:
        summary.totalCostInCredits > 0
          ? t("script_project.stats_total_cost.value", {
              credits: summary.totalCostInCredits.toFixed(CREDIT_DECIMALS)
            })
          : 0
    }
  ].filter((row) => row.value !== 0);

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
      <Button
        className="flex h-5 w-5 items-center justify-center rounded text-glyph-tertiary hover:bg-element-primary-active hover:text-glyph-secondary"
        aria-label={t("script_project.stats_button.ariaLabel")}
        data-testid="script-project-stats-tooltip"
      >
        <Icon iconSet="16" iconName="info" />
      </Button>
    </Tooltip>
  );
};
