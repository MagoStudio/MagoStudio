import { Text } from "@components/Text";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { useTranslation } from "react-i18next";

interface ImageToVideoRenderErrorStateProps {
  errorMessage: string | undefined;
}

export const ImageToVideoRenderErrorState: React.FC<
  ImageToVideoRenderErrorStateProps
> = ({ errorMessage }) => {
  const { t } = useTranslation();
  const { visible, showTooltip, hideTooltip } = useTooltip();
  const tooltipMessage =
    errorMessage || t("notifications.render_generation_failed.description");

  return (
    <div
      data-testid="image-to-video-render-error"
      className="flex flex-col gap-2"
    >
      <div
        data-testid="image-to-video-render-error-info"
        className="flex items-center gap-1"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <Text
          component="span"
          variant="xs"
          color="glyph-error"
          whiteSpace="nowrap"
        >
          {t("status.failed.label")}
        </Text>
        <TooltipIcon isVisible={visible} variant="info" iconColor="glyph-error">
          {tooltipMessage}
        </TooltipIcon>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded bg-surface-background" />
    </div>
  );
};
