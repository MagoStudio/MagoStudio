import { GlyphPalette } from "@styles/types";
import { cn } from "@utils";
import { formatCreditCount } from "@utils/formatCreditCount";

import { Icon } from "../Icon";
import { colorClasses, Text } from "../Text";

type Props = {
  className?: string;
  color?: GlyphPalette | "inherit";
  count?: number | string;
  disabled?: boolean;
  marginLeft?: boolean;
  monochrome?: boolean;
  variant?: "sm" | "md";
  weight?: "normal" | "bold";
  icon?: "default" | "out" | "locked" | "off";
} & React.HTMLAttributes<HTMLElement>;

export const CreditCoin: React.FC<Props> = ({
  className,
  color = "inherit",
  count,
  disabled,
  marginLeft,
  monochrome,
  variant = "sm",
  weight = "normal",
  icon = "default"
}) => {
  const getIconName = () => {
    if (monochrome) return "credits-mono";
    if (icon === "out") return "out-of-credits";
    if (icon === "locked") return "credits-locked";
    if (icon === "off") return "credits-off";
    return "credits";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center",
        colorClasses[color],
        marginLeft && "ml-2",
        className
      )}
    >
      <Icon
        iconSet="pixels"
        iconName={getIconName()}
        className="h-4 w-4 mr-1"
      />
      {count !== undefined && (
        <Text
          color={color}
          component="span"
          disabled={disabled}
          variant={variant}
          weight={weight}
        >
          {formatCreditCount(count ?? 0)}
        </Text>
      )}
    </div>
  );
};
