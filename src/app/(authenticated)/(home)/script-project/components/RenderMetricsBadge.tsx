import { Icon } from "@components/Icon";
import { Popover } from "@components/Popover";
import { Text } from "@components/Text";
import { useRenderMetrics } from "@domains/scriptProject/useRenderMetrics";
import { RenderMetricsKind } from "@domains/scriptProject/utils/renderMetricsTypes";
import {
  METRICS_MAX_SCORE,
  getRenderMetricsVerdict,
  listRenderMetricsAxes
} from "@domains/scriptProject/utils/summariseRenderMetrics";
import { isLocalApp } from "@platform/localDesktop";
import { isCloudRenderAvailable } from "@platform/renderTarget";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { DialogTrigger } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

const VERDICT_STYLE = {
  pass: "bg-element-success text-glyph-primary-on-pic",
  fail: "bg-element-error text-glyph-primary-on-pic",
  pending: "bg-element-on-image text-glyph-primary-on-pic",
  error: "bg-element-on-image text-glyph-secondary",
  none: ""
} as const;

const VERDICT_LABEL_KEY = {
  pass: "script_project.metrics_passed.label",
  fail: "script_project.metrics_failed.label",
  pending: "script_project.metrics_pending.label",
  error: "script_project.metrics_not_scored.label",
  none: "script_project.metrics_pending.label"
} as const;

type Props = {
  assetId: string;
  kind: RenderMetricsKind;
  hasRenderFinished: boolean;
  className?: string;
};

export const RenderMetricsBadge: React.FC<Props> = ({
  assetId,
  kind,
  hasRenderFinished,
  className
}) => {
  const { t } = useTranslation();
  const { data: metrics } = useRenderMetrics(
    assetId,
    kind,
    hasRenderFinished && (isLocalApp || isCloudRenderAvailable())
  );

  const verdict = getRenderMetricsVerdict(metrics);
  if (verdict === "none") return null;

  const axes = listRenderMetricsAxes(metrics);
  const hasScore = verdict === "pass" || verdict === "fail";
  const label = hasScore
    ? t("script_project.metrics_score.label", {
        score: metrics?.score?.toFixed(1) ?? "—",
        max: METRICS_MAX_SCORE
      })
    : t(VERDICT_LABEL_KEY[verdict]);

  return (
    /* DialogTrigger owns the open state: pressing the badge again closes it, and a modal
     * popover dismisses on an outside press and on Escape. Driving it from our own useState
     * fought React Aria — its close-on-outside-press fired first, then our toggle reopened it. */
    <DialogTrigger>
      <AriaButton
        data-testid={`render-metrics-${assetId}`}
        className={cn(
          "absolute left-1 top-1 flex h-6 items-center gap-1.5 rounded px-1.5 py-0.5 font-lato text-sm font-normal outline-hidden backdrop-blur-[10px]",
          VERDICT_STYLE[verdict],
          className
        )}
      >
        {label}
        <Icon iconSet="16" iconName="info" className="h-3 w-3" />
      </AriaButton>

      <Popover placement="bottom" isNonModal={false} className="max-w-80">
        <div
          className="flex flex-col gap-1.5"
          data-testid={`render-metrics-detail-${assetId}`}
        >
          <Text variant="sm" weight="semibold">
            {t(VERDICT_LABEL_KEY[verdict])}
          </Text>

          {axes.map((axis) => (
            <div key={axis.labelKey} className="flex justify-between gap-6">
              <Text variant="xs" color="glyph-secondary">
                {t(axis.labelKey)}
              </Text>
              <Text variant="xs">
                {t("script_project.metrics_axis_score.label", {
                  score: axis.score.toFixed(1),
                  max: METRICS_MAX_SCORE
                })}
              </Text>
            </div>
          ))}

          {metrics?.evaluationError && (
            <Text variant="xs" color="glyph-tertiary" lineHeight="relaxed">
              {t("script_project.metrics_error_reason.label", {
                stage: metrics.evaluationError.stage,
                message: metrics.evaluationError.message
              })}
            </Text>
          )}

          {(metrics?.issues.length ?? 0) > 0 && (
            <Text variant="xs" color="glyph-error" lineHeight="relaxed">
              {metrics?.issues.join(" · ")}
            </Text>
          )}

          {metrics?.nextPrompt && (
            <Text variant="xs" color="glyph-tertiary" lineHeight="relaxed">
              {t("script_project.metrics_next_prompt.label", {
                suggestion: metrics.nextPrompt
              })}
            </Text>
          )}
        </div>
      </Popover>
    </DialogTrigger>
  );
};
