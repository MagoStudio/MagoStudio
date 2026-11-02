import { CircularProgress } from "@components/CircularProgress";
import { GhostButton } from "@components/GhostButton";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { TooltipIcon } from "@components/TooltipIcon";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useTooltip } from "@hooks/useTooltip";
import { GlyphPalette } from "@styles/types";
import { useTranslation } from "react-i18next";

import { IterateButton } from "./IterateButton";
import { TweakButton } from "./TweakButton";

export type Img2ImgPlaceholderVariant =
  | "loading"
  | "failed"
  | "timeout"
  | "cancelled";

type Props = {
  variant: Img2ImgPlaceholderVariant;
  clipId: string;
  progress?: number;
};

type StatusBadge = {
  labelKey: string;
  color: GlyphPalette;
  tooltipKey?: string;
};

const STATUS_BADGE: Record<
  Exclude<Img2ImgPlaceholderVariant, "loading">,
  StatusBadge
> = {
  failed: {
    labelKey: "status.unknown_error.label",
    color: "glyph-error",
    tooltipKey: "notifications.img2img_generation_failed.description"
  },
  timeout: {
    labelKey: "status.timeout.label",
    color: "glyph-error",
    tooltipKey: "notifications.img2img_generation_failed.description"
  },
  cancelled: {
    labelKey: "status.cancelled.label",
    color: "glyph-warning"
  }
};

export const Img2ImgPlaceholderRender: React.FC<Props> = ({
  variant,
  clipId,
  progress
}) => {
  const { t } = useTranslation();
  const { visible, showTooltip, hideTooltip } = useTooltip();
  const isOnboardingActive = useIsOnboardingActive();

  const isLoading = variant === "loading";
  const progressPercent =
    progress && progress > 0 && progress <= 1 ? progress * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-start gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Text variant="xs" color="glyph-warning" whiteSpace="nowrap">
              {t("status.in_progress.label")}
            </Text>
            <ProgressBar color="glyph-warning" progress={progressPercent} />
          </div>
        ) : (
          (() => {
            const badge = STATUS_BADGE[variant];
            return (
              <div
                className="flex items-center gap-1"
                onMouseEnter={badge.tooltipKey ? showTooltip : undefined}
                onMouseLeave={badge.tooltipKey ? hideTooltip : undefined}
              >
                <Text variant="xs" color={badge.color} whiteSpace="nowrap">
                  {t(badge.labelKey)}
                </Text>
                {badge.tooltipKey && (
                  <TooltipIcon
                    isVisible={visible}
                    variant="info"
                    iconColor={badge.color}
                  >
                    {t(badge.tooltipKey)}
                  </TooltipIcon>
                )}
              </div>
            );
          })()
        )}
      </div>

      <div className="aspect-[154/84] w-full rounded bg-surface-background flex items-center justify-center">
        {isLoading && (
          <CircularProgress color="glyph-primary-on-pic" size="sm" />
        )}
      </div>

      <div className="flex items-center gap-1">
        <GhostButton
          aria-label={t("actions.use_this.label")}
          isDisabled
          colorScheme="white"
          className="flex-1"
        >
          {t("actions.use_this.label")}
        </GhostButton>
        {!isOnboardingActive && (
          <>
            <IterateButton assetId="" isDisabled />
            <TweakButton clipId={clipId} />
            <GhostButton aria-label={t("actions.download.label")} isDisabled>
              {t("actions.download.label")}
            </GhostButton>
          </>
        )}
      </div>
    </div>
  );
};
