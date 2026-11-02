import { Tooltip } from "@components/Tooltip";
import { GlyphPalette, SeverityPalette } from "@styles/types";
import { cn } from "@utils";
import { useState } from "react";

import { Icon } from "../Icon";

type Props = {
  children?: React.ReactNode;
  className?: string;
  icon?: "info" | "help";
  iconSet?: "16" | "16-filled";
  iconSize?: "xs" | "sm";
  iconColor?: GlyphPalette | SeverityPalette;
  isVisible: boolean;
  opacity?: boolean;
  variant?: SeverityPalette;
} & React.HTMLAttributes<HTMLDivElement>;

const variantClasses: Record<string, { tooltip: string; arrow: string }> = {
  error: {
    tooltip: "bg-severity-error text-glyph-primary-on-pic",
    arrow: "fill-severity-error"
  },
  info: {
    tooltip: "bg-surface-bg-100-opacity-80 text-glyph-primary-on-pic",
    arrow: "fill-surface-bg-100-opacity-80"
  },
  warning: {
    tooltip: "bg-element-warning text-glyph-invert-main",
    arrow: "fill-element-warning"
  },
  success: {
    tooltip: "bg-severity-success text-glyph-invert-main",
    arrow: "fill-severity-success"
  }
};

export const TooltipIcon: React.FC<Props> = ({
  children,
  className,
  icon = "info",
  iconSet = "16-filled",
  iconSize = "sm",
  iconColor = "element-tertiary",
  isVisible,
  opacity,
  variant = "info"
}) => {
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null);
  const variantStyle = variantClasses[variant] || variantClasses.info;

  return (
    <div
      className="flex items-center justify-center pointer-events-auto"
      ref={setButtonElement}
    >
      <div
        className={cn(
          "cursor-pointer hover:brightness-110",
          opacity && "opacity-40",
          className
        )}
      >
        {icon === "help" ? (
          <Icon
            iconSet="16"
            iconName="help"
            className={cn(
              iconSize === "xs" ? "h-3 w-3" : "h-4 w-4",
              `text-${iconColor}` // eslint-disable-line better-tailwindcss/no-unknown-classes
            )}
            aria-label="Info"
          />
        ) : (
          <Icon
            iconSet={iconSet}
            iconName="info"
            className={cn(
              iconSize === "xs" ? "h-3 w-3" : "h-4 w-4",
              `text-${iconColor}` // eslint-disable-line better-tailwindcss/no-unknown-classes
            )}
            aria-label="Info"
          />
        )}
      </div>
      <Tooltip
        className={variantStyle.tooltip}
        arrowClassName={variantStyle.arrow}
        isVisible={isVisible}
        placement="top"
        textContent={children}
        targetElement={buttonElement}
      />
    </div>
  );
};
