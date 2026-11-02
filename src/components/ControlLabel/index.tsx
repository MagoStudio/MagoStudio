import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { TooltipImage } from "@models/shared/types";
import { cn } from "@utils";

type Props = {
  disabled?: boolean;
  inputId?: string;
  label?: string;
  labelColor?: "glyph-secondary" | "glyph-tertiary";
  tooltip?: string;
  tooltipImage?: string;
  tooltipFormat?: "markdown";
  tooltipImages?: TooltipImage[];
} & Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "size">;

export const ControlLabel: React.FC<Props> = ({
  className,
  disabled,
  inputId,
  label,
  labelColor = "glyph-secondary",
  tooltip,
  tooltipImage,
  tooltipFormat,
  tooltipImages
}) => {
  const labelElement = (
    <label
      className={cn(
        "min-w-0 font-medium select-none text-sm line-clamp-2 text-ellipsis group-hover:text-glyph-primary",
        disabled && "text-glyph-disabled-opacity-70 pointer-events-none",
        labelColor === "glyph-secondary" && "text-glyph-secondary",
        labelColor === "glyph-tertiary" && "text-glyph-tertiary",
        className
      )}
      htmlFor={inputId}
    >
      {label}
    </label>
  );

  const hasTooltip = !!label && !!tooltip;

  if (!hasTooltip) {
    return labelElement;
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {labelElement}
      <InfoTooltipIcon
        tooltip={tooltip}
        tooltipImage={tooltipImage}
        tooltipFormat={tooltipFormat}
        tooltipImages={tooltipImages}
        labelColor={labelColor}
      />
    </div>
  );
};
