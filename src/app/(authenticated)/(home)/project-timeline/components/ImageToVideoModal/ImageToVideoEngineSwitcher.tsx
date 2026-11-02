import { RadioPill, RadioPillOption } from "@components/RadioPill";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { useTranslation } from "react-i18next";

import {
  ImageToVideoEngineTier,
  useSwitchImageToVideoEngine
} from "./hooks/useSwitchImageToVideoEngine";
import { ImageToVideoEngineTierComparison } from "./ImageToVideoEngineTierComparison";

export const ImageToVideoEngineSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { engineTier, switchEngineTier } = useSwitchImageToVideoEngine();
  const { visible, showTooltip, hideTooltip } = useTooltip();

  const options: RadioPillOption<ImageToVideoEngineTier>[] = [
    {
      value: "standard",
      label: t("projectTimeline.imageToVideo.engineTier.standard.label")
    },
    {
      value: "fast",
      label: t("projectTimeline.imageToVideo.engineTier.fast.label")
    }
  ];

  return (
    <div className="flex items-center gap-2">
      <RadioPill
        options={options}
        value={engineTier}
        onChange={(nextTier) => {
          if (nextTier) switchEngineTier(nextTier);
        }}
        aria-label={t("projectTimeline.imageToVideo.engineTier.ariaLabel")}
      />
      <div
        data-testid="image-to-video-engine-tier-info"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <TooltipIcon isVisible={visible} iconColor="glyph-secondary" opacity>
          <ImageToVideoEngineTierComparison />
        </TooltipIcon>
      </div>
    </div>
  );
};
