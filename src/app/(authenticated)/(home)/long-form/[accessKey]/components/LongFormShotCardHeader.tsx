import { Text } from "@components/Text";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { GlyphPalette } from "@styles/types";

interface LongFormShotCardHeaderProps {
  label: string;
  status: string | undefined;
  statusColor: GlyphPalette;
  tooltipMessage: string | undefined;
}

export const LongFormShotCardHeader: React.FC<LongFormShotCardHeaderProps> = ({
  label,
  status,
  statusColor,
  tooltipMessage
}) => {
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Text
        component="span"
        variant="sm"
        color="glyph-secondary"
        className="shrink-0"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
      {status && (
        <Text
          component="span"
          variant="2xs"
          color={statusColor}
          className="min-w-0 flex-1 leading-4"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {status}
        </Text>
      )}
      {tooltipMessage && (
        <div
          data-testid="long-form-shot-card-info"
          className="shrink-0"
          tabIndex={0}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
        >
          <TooltipIcon
            isVisible={visible}
            variant="info"
            iconColor="glyph-error"
          >
            {tooltipMessage}
          </TooltipIcon>
        </div>
      )}
    </div>
  );
};
