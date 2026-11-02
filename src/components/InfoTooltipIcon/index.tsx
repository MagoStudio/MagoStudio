import { Icon } from "@components/Icon";
import { Popover } from "@components/Popover";
import { TooltipImage } from "@models/shared/types";
import { cn } from "@utils";
import { useRef, useState } from "react";

import { RichTooltipBody } from "./RichTooltipBody";

type Props = {
  tooltip: string;
  tooltipImage?: string;
  tooltipFormat?: "markdown";
  tooltipImages?: TooltipImage[];
  labelColor?:
    | "glyph-secondary"
    | "glyph-tertiary"
    | "glyph-error"
    | "glyph-warning";
};

export const InfoTooltipIcon: React.FC<Props> = ({
  tooltip,
  tooltipImage,
  tooltipFormat,
  tooltipImages,
  labelColor = "glyph-secondary"
}) => {
  const isRichTooltip =
    tooltipFormat === "markdown" || (tooltipImages?.length ?? 0) > 0;
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isTriggerHovered = useRef(false);
  const isPopoverHovered = useRef(false);

  const closeIfNeeded = () => {
    requestAnimationFrame(() => {
      if (!isTriggerHovered.current && !isPopoverHovered.current) {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <div
        ref={triggerRef}
        data-testid="control-label-info-trigger"
        className="shrink-0 flex items-center justify-center pointer-events-auto"
        onMouseEnter={() => {
          isTriggerHovered.current = true;
          setIsOpen(true);
        }}
        onMouseLeave={() => {
          isTriggerHovered.current = false;
          closeIfNeeded();
        }}
      >
        <div
          className={cn(
            "cursor-pointer",
            labelColor === "glyph-error" || labelColor === "glyph-warning"
              ? "opacity-100"
              : "opacity-50"
          )}
        >
          <Icon
            iconSet="16-filled"
            iconName="info"
            className={cn(
              "h-4 w-4",
              labelColor === "glyph-secondary" && "text-glyph-secondary",
              labelColor === "glyph-tertiary" && "text-glyph-tertiary",
              labelColor === "glyph-error" && "text-glyph-error",
              labelColor === "glyph-warning" && "text-glyph-warning"
            )}
          />
        </div>
      </div>
      <Popover
        triggerRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement={isRichTooltip ? "left" : "top"}
        onMouseEnter={() => {
          isPopoverHovered.current = true;
        }}
        onMouseLeave={() => {
          isPopoverHovered.current = false;
          closeIfNeeded();
        }}
      >
        {isRichTooltip ? (
          <RichTooltipBody markdown={tooltip} images={tooltipImages} />
        ) : (
          <>
            {tooltip}
            {tooltipImage && (
              <img className="mt-2" alt="Tooltip image" src={tooltipImage} />
            )}
          </>
        )}
      </Popover>
    </>
  );
};
