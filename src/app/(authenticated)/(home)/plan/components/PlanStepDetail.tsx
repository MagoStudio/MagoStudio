import { Badge } from "@components/Badge";
import { Text } from "@components/Text";
import { extractStepImageAssets } from "@domains/plan/utils/extractStepImageAssets";
import { formatPlanTimestamp } from "@domains/plan/utils/formatPlanTimestamp";
import { STEP_STATUS_COLOR_MAP } from "@domains/plan/utils/planStatuses";
import { PlanStep } from "@schemas/plan";
import { useTranslation } from "react-i18next";

import { PlanStepAssetImage } from "./PlanStepAssetImage";

interface PlanStepDetailProps {
  step: PlanStep;
}

export const PlanStepDetail: React.FC<PlanStepDetailProps> = ({ step }) => {
  const { t } = useTranslation();
  const { outputs, references } = extractStepImageAssets(step.result);
  const hasImages = outputs.length > 0 || references.length > 0;
  const startedAt = formatPlanTimestamp(step.started_at);
  const finishedAt = formatPlanTimestamp(step.finished_at);
  const hasResult = step.result && Object.keys(step.result).length > 0;
  const hasArgs = step.tool_args && Object.keys(step.tool_args).length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-surface-bg-100 h-full overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <Text variant="md" weight="semibold" color="glyph-primary">
          {t(`plan.step_tool.${step.tool_name}.label`)}
        </Text>
        <Badge glyphColor={STEP_STATUS_COLOR_MAP[step.status]}>
          {t(`plan.step_status.${step.status}.label`)}
        </Badge>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {startedAt && (
          <Text variant="xs" color="glyph-tertiary">
            {t("plan.started_at.label")}: {startedAt}
          </Text>
        )}
        {finishedAt && (
          <Text variant="xs" color="glyph-tertiary">
            {t("plan.finished_at.label")}: {finishedAt}
          </Text>
        )}
        {step.retry_count != null && step.retry_count > 0 && (
          <Text variant="xs" color="glyph-warning">
            {t("plan.retries.label")}: {step.retry_count}
            {step.max_retries != null ? `/${step.max_retries}` : ""}
          </Text>
        )}
      </div>

      {step.error && (
        <div className="flex flex-col gap-1">
          <Text variant="xs" weight="semibold" color="glyph-error">
            {t("plan.error_details.label")}
          </Text>
          <Text
            variant="xs"
            color="glyph-error"
            className="whitespace-pre-wrap break-all"
          >
            {step.error.message}
          </Text>
          {step.error.traceback && (
            <pre className="text-xs text-glyph-tertiary bg-surface-bg-300 rounded p-2 overflow-x-auto max-h-60 mt-1">
              {step.error.traceback}
            </pre>
          )}
        </div>
      )}

      {hasImages && (
        <div className="flex flex-col gap-3">
          {outputs.length > 0 && (
            <div className="flex flex-col gap-1">
              <Text variant="2xs" color="glyph-tertiary">
                {t("plan.phase.result.label")}
              </Text>
              <div className="flex gap-2 flex-wrap">
                {outputs.map((id) => (
                  <PlanStepAssetImage
                    key={id}
                    assetId={id}
                    className="h-40 w-40"
                  />
                ))}
              </div>
            </div>
          )}
          {references.length > 0 && (
            <div className="flex flex-col gap-1">
              <Text variant="2xs" color="glyph-tertiary">
                {t("plan.phase.references.label")}
              </Text>
              <div className="flex gap-2 flex-wrap">
                {references.map((id) => (
                  <PlanStepAssetImage
                    key={id}
                    assetId={id}
                    className="h-20 w-20"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasResult && (
        <div className="flex flex-col gap-1">
          <Text variant="xs" weight="semibold" color="glyph-secondary">
            {t("plan.step_result.label")}
          </Text>
          <pre className="text-xs text-glyph-tertiary bg-surface-bg-300 rounded p-2 overflow-x-auto max-h-60">
            {JSON.stringify(step.result, null, 2)}
          </pre>
        </div>
      )}

      {hasArgs && (
        <div className="flex flex-col gap-1">
          <Text variant="xs" weight="semibold" color="glyph-secondary">
            {t("plan.step_args.label")}
          </Text>
          <pre className="text-xs text-glyph-tertiary bg-surface-bg-300 rounded p-2 overflow-x-auto max-h-60">
            {JSON.stringify(step.tool_args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
