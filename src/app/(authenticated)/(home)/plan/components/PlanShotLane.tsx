import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { ShotRollup } from "@domains/plan/utils/buildShotRollups";
import { TIMELINE_SUMMARY_COLOR_MAP } from "@domains/plan/utils/groupPlanStepsByTimeline";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { PlanImg2ImgCard } from "./PlanImg2ImgCard";
import { PlanStepAssetImage } from "./PlanStepAssetImage";
import { PlanVideoCard } from "./PlanVideoCard";

interface PlanShotLaneProps {
  rollup: ShotRollup;
  shotName: string;
  projectId: string | undefined;
  onOpenShot?: () => void;
}

export const PlanShotLane: React.FC<PlanShotLaneProps> = ({
  rollup,
  shotName,
  projectId,
  onOpenShot
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const { img2img } = rollup;
  const hasImg2Img =
    img2img.inputImageIds.length > 0 ||
    !!img2img.resultAssetId ||
    img2img.isRendering ||
    !!img2img.metric;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-surface-bg-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AriaButton
            onPress={() => setIsOpen((prev) => !prev)}
            aria-label={t(isOpen ? "plan.collapse.label" : "plan.expand.label")}
            className="flex items-center justify-center text-glyph-tertiary cursor-pointer outline-hidden"
          >
            <Icon
              iconSet="16"
              iconName={isOpen ? "chevron-down" : "chevron-right"}
            />
          </AriaButton>
          <AriaButton
            onPress={() => onOpenShot?.()}
            isDisabled={!onOpenShot}
            className="min-w-0 text-left cursor-pointer outline-hidden disabled:cursor-default"
          >
            <Text
              component="h3"
              variant="md"
              weight="semibold"
              color="glyph-primary"
              className="truncate hover:underline"
            >
              {shotName}
            </Text>
          </AriaButton>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rollup.currentToolName && rollup.status === "running" && (
            <Text variant="xs" color="glyph-tertiary">
              {t(`plan.step_tool.${rollup.currentToolName}.label`)}
            </Text>
          )}
          <Badge glyphColor={TIMELINE_SUMMARY_COLOR_MAP[rollup.status]}>
            {t(`plan.timeline_summary.${rollup.status}.label`)}
          </Badge>
        </div>
      </div>

      {isOpen && (
        <>
          {rollup.waitingForPrev && (
            <Text variant="sm" color="glyph-tertiary">
              {t("plan.phase.waiting_prev.label")}
            </Text>
          )}
          {rollup.prevShotFailed && (
            <Text variant="sm" color="glyph-error">
              {t("plan.phase.prev_failed.label")}
            </Text>
          )}

          {hasImg2Img && (
            <PlanImg2ImgCard img2img={img2img} projectId={projectId} />
          )}
          {rollup.video.present && <PlanVideoCard video={rollup.video} />}

          {rollup.keyframeHandoffAssetId && (
            <div className="flex flex-col gap-1">
              <Text variant="2xs" color="glyph-tertiary">
                {t("plan.phase.keyframe_handoff.label")}
              </Text>
              <PlanStepAssetImage
                assetId={rollup.keyframeHandoffAssetId}
                className="h-20 w-20"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
