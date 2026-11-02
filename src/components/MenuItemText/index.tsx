/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Text } from "@components/Text";
import { GlyphPalette, SeverityPalette } from "@styles/types";
import { cn } from "@utils";
import { useEffect, useRef, useState } from "react";

const fontWeightClasses = {
  medium: "font-medium",
  semibold: "font-semibold"
};

type Props = {
  children?: React.ReactNode;
  className?: string;
  subtitle?: string;
  title?: string;
  titleFontWeight?: "medium" | "semibold";
  titleColor?: GlyphPalette | SeverityPalette;
} & React.HTMLAttributes<HTMLElement>;

export const MenuItemText: React.FC<Props> = ({
  children,
  className,
  subtitle,
  title,
  titleFontWeight = "medium",
  titleColor = "glyph-secondary",
  ...props
}) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  /* eslint-disable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change -- post-layout DOM overflow measurement, not derivable in render */
  useEffect(() => {
    const { current } = titleRef;
    if (current) {
      setIsOverflowed(current.scrollWidth > current.clientWidth);
    }
  }, [title, subtitle, children]);
  /* eslint-enable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change */

  return (
    <div
      className={cn("flex-auto min-w-0 pr-4 select-none", className)}
      {...props}
    >
      {title && (
        <div className="flex flex-col" title={isOverflowed ? title : ""}>
          {title && (
            <Text
              className={cn(
                "overflow-hidden text-ellipsis whitespace-nowrap",
                fontWeightClasses[titleFontWeight]
              )}
              color={titleColor}
              component="span"
              variant="md"
              ref={titleRef}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              className="text-wrap"
              color="glyph-secondary"
              component="span"
              variant="sm"
            >
              {subtitle}
            </Text>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
